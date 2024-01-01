"use server";

import { cookies } from "next/headers";

export async function signIn(formData: FormData) {
  cookies().set("userUuid", formData.get("userUuid") as string);
}

export async function signOut() {
  cookies().delete("userUuid");
}
