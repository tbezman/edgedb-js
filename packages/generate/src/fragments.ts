import { adapter, type Client } from "edgedb";
import type { CommandOptions } from "./commandutil";
import { Project, SyntaxKind, VariableDeclarationKind } from "ts-morph";

const { path } = adapter;

export function generateFragmentManifest(params: {
  root: string | null;
  options: CommandOptions;
  client: Client;
  schemaDir: string;
}) {
  const tsConfigFilePath = params.root
    ? path.join(params.root, "tsconfig.json")
    : "tsconfig.json";
  const project = new Project({
    tsConfigFilePath,
  });

  const files = project.getSourceFiles();

  const manifest = project.createSourceFile(
    path.join(params.schemaDir, "edgeql-js", "manifest.ts"),
    undefined,
    {
      overwrite: true,
    }
  );

  manifest.addImportDeclaration({
    defaultImport: "e",
    namedImports: [{ isTypeOnly: true, name: "Cardinality" }],
    moduleSpecifier: "./index",
  });

  manifest.addTypeAlias({
    name: "ExprShape",
    typeParameters: [{ name: "Expr", constraint: "ObjectTypeExpression" }],
    type: `
    $scopify<
      Expr["__element__"]
    > &
      $linkPropify<{
        [k in keyof Expr]: k extends "__cardinality__"
          ? typeof Cardinality.One
          : Expr[k];
      }>
      `,
  });

  type Fragment =
    | {
        kind: "normal";
        name: string;
        type: string;
        text: string;
      }
    | {
        kind: "query";
        name: string;
        text: string;
      };

  const fragments: Array<Fragment> = [];
  for (const file of files) {
    file
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .forEach((callExpression) => {
        const pae = callExpression?.getChildAtIndexIfKind(
          0,
          SyntaxKind.PropertyAccessExpression
        );

        const identifiers = pae?.getChildrenOfKind(SyntaxKind.Identifier) ?? [];
        const [first, second] = identifiers;

        const firstText = first?.getText();
        const secondText = second?.getText();
        if (
          firstText === "e" &&
          (secondText === "fragment" || secondText === "queryFragment") &&
          callExpression
        ) {
          const nameArgument = callExpression.getArguments()[0];
          const fragmentName = nameArgument
            .getText()
            .slice(1, nameArgument.getText().length - 1);

          const typeArgument = callExpression.getArguments()[1];
          const typeName = typeArgument.getText().split("e.")[1];

          const kind: "query" | "normal" =
            secondText === "fragment" ? "normal" : "query";

          fragments.push({
            kind,
            name: fragmentName,
            text: callExpression.getText(),
            type: typeName,
          });
        }
      });
  }

  manifest.addImportDeclaration({
    namedImports: [
      "$expr_Select",
      "normaliseShape",
      "SelectModifierNames",
      "ComputeSelectCardinality",
      "SelectModifiers",
      "objectTypeToSelectShape",
    ],
    moduleSpecifier: "./select",
  });

  manifest.addImportDeclaration({
    moduleSpecifier: "./typesystem",
    namedImports: ["ObjectType", "$scopify", "ObjectTypeExpression"],
  });

  manifest.addImportDeclaration({
    moduleSpecifier: "./syntax",
    namedImports: ["$linkPropify", "FragmentReturnType"],
  });

  for (const fragment of fragments) {
    manifest.addTypeAlias({
      isExported: true,
      name: `${fragment.name}Ref`,
      type: (writer) => {
        writer.block(() => {
          writer.write(`${fragment.name}: true`);
        });
      },
    });

    manifest.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        { name: `${fragment.name}Definition`, initializer: fragment.text },
      ],
    });

    manifest.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: fragment.name + "Masked",
          initializer: (writer) => {
            writer.write("(");

            if (fragment.kind === "normal") {
              writer.write(`shape: ExprShape<typeof e.${fragment.type}>`);
            }

            writer.write(") =>");

            writer.block(() => {
              if (fragment.kind === "query") {
                writer.write(`const FragmentMaskType = {
                    '${fragment.name}': e.select(e.bool(true)),
                  }`);

                writer.writeLine("type AsType = typeof FragmentMaskType");
              } else if (fragment.kind === "normal") {
                writer.write(`const FragmentMaskType = e.shape(e.${fragment.type}, () => ({
                    '${fragment.name}': e.select(e.bool(true)),
                  }))`);

                writer.writeLine(
                  "type AsType = ReturnType<typeof FragmentMaskType>"
                );
              }

              writer.blankLine();

              writer.write("return ");

              writer.inlineBlock(() => {
                writer.write("__" + fragment.name);

                if (fragment.kind === "query") {
                  writer.write(
                    `: e.select(${fragment.name}Definition.shape())`
                  );
                } else if (fragment.kind === "normal") {
                  writer.write(
                    `: e.select(shape, ${fragment.name}Definition.shape())`
                  );
                }
              });

              writer.write("as unknown as AsType");
            });
          },
        },
      ],
    });

    manifest.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: fragment.name + "Raw",
          initializer: (writer) => {
            writer.write("(");

            if (fragment.kind === "normal") {
              writer.write(`shape: ExprShape<typeof e.${fragment.type}>`);
            }

            writer.write(") =>");

            writer.block(() => {
              writer.write("return ");

              writer.inlineBlock(() => {
                writer.write("__" + fragment.name);
                if (fragment.kind === "query") {
                  writer.write(": e.select(");
                } else if (fragment.kind === "normal") {
                  writer.write(": e.select(shape, ");
                }
                // TEMPORARY HACK TO ENSURE WE GET RAW FRAGMENTS ALL THE WAY DOWN
                writer.write(
                  fragment.text.replaceAll(/\.\.\.(\w+)/g, "...$1.raw")
                );
                writer.write(".shape())");
              });
            });
          },
        },
      ],
    });

    manifest.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: fragment.name,
          type: (writer) => {
            writer.write(`typeof ${fragment.name}Masked &`);

            writer.block(() => {
              writer.writeLine("fragmentName: string");
              writer.writeLine(`raw: typeof ${fragment.name}Raw`);
              writer.writeLine(`definition: typeof ${fragment.name}Definition`);

              if (fragment.kind === "normal") {
                writer.writeLine(`expr: typeof e.${fragment.type}`);
              }
            });
          },
          initializer: (writer) => {
            writer.write(`Object.assign(${fragment.name}Masked, `);

            writer.block(() => {
              writer.write(`fragmentName: '${fragment.name}',`);
              writer.write(`raw: ${fragment.name}Raw,`);
              writer.write(`definition: ${fragment.name}Definition,`);

              if (fragment.kind === "normal") {
                writer.write(`expr: e.${fragment.type},`);
              }
            });

            writer.write(`)`);
          },
        },
      ],
    });
  }

  manifest.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: "fragmentMap",
        initializer: (writer) => {
          writer.write(`new Map<string,`);

          const fragmentType = fragments
            .map((fragment) => `typeof ${fragment.name}Definition`)
            .join(" | ");

          writer.write(fragmentType);

          writer.write(`>()`);
        },
      },
    ],
  });

  manifest.addStatements(
    fragments.map((fragment) => {
      return (writer) => {
        writer.writeLine(
          `fragmentMap.set('${fragment.name}', ${fragment.name}Definition)`
        );
      };
    })
  );

  manifest.addExportDeclaration({ namedExports: ["fragmentMap"] });

  manifest.formatText();
  manifest.saveSync();
}
