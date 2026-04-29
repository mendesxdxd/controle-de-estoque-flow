import { getTenant } from "./tenant";

export type Role = "admin" | "operador" | "visualizador";

export async function getRole(): Promise<Role> {
  const tenant = await getTenant();
  return tenant?.role ?? "visualizador";
}

export async function exigirRole(...rolesPermitidos: Role[]) {
  const role = await getRole();
  if (!rolesPermitidos.includes(role)) {
    throw new Error("Sem permissao para esta acao.");
  }
}
