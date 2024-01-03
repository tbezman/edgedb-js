#![feature(box_patterns)]

use std::path::PathBuf;

use swc_common::plugin::metadata::TransformPluginMetadataContextKind;
use swc_core::atoms::Atom;
use swc_core::ecma::ast::*;
use swc_core::ecma::transforms::testing::test_inlined_transform;
use swc_core::ecma::visit::VisitMutWith;
use swc_core::ecma::{
    ast::Program,
    transforms::testing::test,
    visit::{as_folder, FoldWith, VisitMut},
};
use swc_core::plugin::{plugin_transform, proxies::TransformPluginProgramMetadata};
use swc_ecma_parser::{Syntax, TsConfig};

pub struct TransformVisitor {
    function_name: Option<String>,
    filename: Option<String>,
}

impl VisitMut for TransformVisitor {
    fn visit_mut_fn_decl(&mut self, n: &mut FnDecl) {
        self.function_name = Some(n.ident.sym.to_string());

        n.visit_mut_children_with(self);
    }

    fn visit_mut_call_expr(&mut self, call_expr: &mut CallExpr) {
        match &call_expr.callee {
            Callee::Expr(box Expr::Ident(ident)) if ident.sym.as_str() == "useQueryFragment" => {
                let args = &mut call_expr.args;
                let shape = args.remove(1);

                let fragment_name = match &self.function_name {
                    Some(function_name) => Some(format!("{}QueryFragment", function_name)),
                    _ => None,
                };

                let fragment_expr = ExprOrSpread {
                    spread: None,
                    expr: Box::new(Expr::Call(CallExpr {
                        span: Default::default(),
                        callee: Callee::Expr(Box::new(Expr::Member(MemberExpr {
                            span: Default::default(),
                            obj: Box::new(Expr::Ident(Ident {
                                span: Default::default(),
                                sym: Atom::from("e"),
                                optional: false,
                            })),
                            prop: MemberProp::Ident(Ident {
                                span: Default::default(),
                                sym: Atom::from("queryFragment"),
                                optional: false,
                            }),
                        }))),
                        args: vec![
                            ExprOrSpread {
                                spread: None,
                                expr: Box::new(Expr::Lit(Lit::Str(Str::from(
                                    fragment_name.expect("no query fragment name generated"),
                                )))),
                            },
                            shape,
                        ],
                        type_args: None,
                    })),
                };

                args.insert(1, fragment_expr);
            }
            Callee::Expr(box Expr::Ident(ident)) if ident.sym.as_str() == "useFragment" => {
                if call_expr.args.len() != 3 {
                    return;
                }

                let args = &mut call_expr.args;
                let shape = args.remove(2);
                let expr = args.remove(1);

                let expr_type = match &expr.expr {
                    box Expr::Member(MemberExpr {
                        prop: MemberProp::Ident(ident),
                        ..
                    }) => Some(ident.sym.to_string()),
                    _ => None,
                };

                let fragment_name = match (&self.function_name, expr_type) {
                    (Some(function_name), Some(expr_type)) => {
                        Some(format!("{}{}Fragment", function_name, expr_type))
                    }
                    _ => None,
                };

                let fragment_expr = ExprOrSpread {
                    spread: None,
                    expr: Box::new(Expr::Call(CallExpr {
                        span: Default::default(),
                        callee: Callee::Expr(Box::new(Expr::Member(MemberExpr {
                            span: Default::default(),
                            obj: Box::new(Expr::Ident(Ident {
                                span: Default::default(),
                                sym: Atom::from("e"),
                                optional: false,
                            })),
                            prop: MemberProp::Ident(Ident {
                                span: Default::default(),
                                sym: Atom::from("fragment"),
                                optional: false,
                            }),
                        }))),
                        args: vec![
                            ExprOrSpread {
                                spread: None,
                                expr: Box::new(Expr::Lit(Lit::Str(Str::from(
                                    fragment_name.expect("no fragment name generated"),
                                )))),
                            },
                            expr,
                            shape,
                        ],
                        type_args: None,
                    })),
                };

                args.insert(1, fragment_expr);
            }
            _ => {}
        }
    }
}

#[plugin_transform]
pub fn process_transform(program: Program, metadata: TransformPluginProgramMetadata) -> Program {
    let filename: Option<String> = if let Some(filename) =
        metadata.get_context(&TransformPluginMetadataContextKind::Filename)
    {
        let buf = PathBuf::from(filename);
        Some(buf.file_stem().unwrap().to_str().unwrap().to_string())
    } else {
        None
    };

    tracing::info!("Filename: {:?}", filename);

    if let Some(filename) = &filename {
        if filename.contains("manifest") {
            return program;
        }
    }

    return program.fold_with(&mut as_folder(TransformVisitor {
        filename,
        function_name: None,
    }));
}

#[test]
fn query_fragment_testt() {
    test_inlined_transform(
        "Query Fragment",
        Syntax::Typescript(TsConfig {
            tsx: true,
            ..Default::default()
        }),
        |_| {
            as_folder(TransformVisitor {
                filename: Some("".to_string()),
                function_name: None,
            })
        },
        r#"
export function SignInSignOutButton({
  queryRef,
}: {
  queryRef: SignInSignOutButtonQueryFragmentRef;
}) {
  const [open, setOpen] = useQueryState("sign-in", parseAsBoolean);

  const { authedUser: user, users } = useQueryFragment(queryRef, {
    users: e.select(e.User, (user) => ({
      ...UserListModalUserFragment(user),
    })),
    authedUser: e.select(e.User, (user) => {
      return {
        id: true,
        name: true,

        filter_single: {
          id: e.cast(e.uuid, e.param("userUuid", e.uuid)),
        },
      };
    }),
  });
}
    "#,
        false,
    )
}

#[test]
fn fragment_test() {
    test_inlined_transform(
        "Fragment",
        Syntax::Typescript(TsConfig {
            tsx: true,
            ..Default::default()
        }),
        |_| {
            as_folder(TransformVisitor {
                filename: Some("".to_string()),
                function_name: None,
            })
        },
        r#"
export function PostCard({ postRef }: PostCardProps) {
  const post = useFragment(postRef, e.Post, () => ({
    id: true,
    title: true,
    content: true,
  }));
}
    "#,
        false,
    )
}
