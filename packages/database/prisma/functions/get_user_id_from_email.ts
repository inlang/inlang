import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function apply_get_user_id_from_email() {
  await prisma.$queryRawUnsafe(`
    create or replace function public.get_user_id_from_email(email TEXT)
    returns uuid
    language plpgsql
    as $$
    declare
       uid uuid;
    begin
      select u.id
      into uid
      from public.user as u
      where u.email = email;
      return uid;
    end;$$ SECURITY DEFINER;
    `);
  console.log("✅ applied function: get_user_id_from_email");
}
