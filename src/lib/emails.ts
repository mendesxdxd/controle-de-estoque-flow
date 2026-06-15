import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
const FROM = "FlowEstoque <noreply@flowestoque.com.br>";

async function getEmailsDoTenant(tenantId: string): Promise<string[]> {
  try {
    const admin = createAdminClient();
    const { data: perfis } = await admin.from("perfis").select("user_id").eq("tenant_id", tenantId);
    if (!perfis?.length) return [];
    const resultados = await Promise.all(perfis.map((p) => admin.auth.admin.getUserById(p.user_id)));
    return resultados.map((r) => r.data.user?.email).filter(Boolean) as string[];
  } catch {
    return [];
  }
}

function base(conteudo: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FlowEstoque</title></head>
<body style="margin:0;padding:0;background:#080810;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080810;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0f0f1a;border:1px solid #1e1e2e;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:24px 40px;border-bottom:1px solid #1e1e2e;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;padding-right:10px;">
              <img src="https://flowestoque.com.br/logo.svg" width="32" height="32" alt="FlowEstoque" style="display:block;border:0;"/>
            </td>
            <td style="vertical-align:middle;">
              <span style="font-size:16px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">FlowEstoque</span>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:40px;">
          ${conteudo}
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #1e1e2e;text-align:center;">
          <p style="margin:0;font-size:12px;color:#4a4a6a;">flowestoque.com.br &nbsp;·&nbsp; suporte@flowestoque.com.br</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function enviar(emails: string[], subject: string, html: string): Promise<void> {
  try {
    await getResend().emails.send({ from: FROM, to: emails, subject, html });
  } catch {
    // falha no envio nao deve quebrar o fluxo principal
  }
}

export async function enviarEmailBoasVindas(tenantId: string, nomeEmpresa: string) {
  const emails = await getEmailsDoTenant(tenantId);
  if (!emails.length) return;

  const html = base(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Bem-vindo ao FlowEstoque!</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#8888aa;line-height:1.6;">Sua empresa <strong style="color:#ffffff;">${escapeHtml(nomeEmpresa)}</strong> esta ativa e pronta para uso.</p>
    <p style="margin:0 0 32px;font-size:14px;color:#8888aa;line-height:1.6;">Acesse o sistema pelo link abaixo e comece a gerenciar seu estoque agora.</p>
    <a href="https://flowestoque.com.br/dashboard" style="display:inline-block;background:#ffffff;color:#080810;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">Acessar o sistema</a>
    <p style="margin:32px 0 0;font-size:12px;color:#4a4a6a;">Qualquer duvida, entre em contato pelo suporte@flowestoque.com.br</p>
  `);

  await enviar(emails, "Bem-vindo ao FlowEstoque!", html);
}

export async function enviarEmailPagamentoRecebido(tenantId: string, nomeEmpresa: string) {
  const emails = await getEmailsDoTenant(tenantId);
  if (!emails.length) return;

  const html = base(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Pagamento confirmado</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#8888aa;line-height:1.6;">Recebemos o pagamento da assinatura de <strong style="color:#ffffff;">${escapeHtml(nomeEmpresa)}</strong>.</p>
    <table cellpadding="0" cellspacing="0" style="background:#1a1a2e;border:1px solid #1e1e2e;border-radius:8px;padding:20px 24px;margin-bottom:32px;width:100%;">
      <tr><td><p style="margin:0 0 4px;font-size:12px;color:#4a4a6a;text-transform:uppercase;letter-spacing:0.5px;">Valor</p><p style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">R$ 500,00</p></td></tr>
      <tr><td style="padding-top:16px;"><p style="margin:0 0 4px;font-size:12px;color:#4a4a6a;text-transform:uppercase;letter-spacing:0.5px;">Periodo</p><p style="margin:0;font-size:14px;color:#ffffff;">Mensalidade — proximo vencimento em 30 dias</p></td></tr>
    </table>
    <a href="https://flowestoque.com.br/dashboard" style="display:inline-block;background:#ffffff;color:#080810;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">Acessar o sistema</a>
    <p style="margin:32px 0 0;font-size:12px;color:#4a4a6a;">Obrigado por confiar no FlowEstoque.</p>
  `);

  await enviar(emails, "Pagamento confirmado — FlowEstoque", html);
}

export async function enviarEmailPagamentoFalhou(tenantId: string, nomeEmpresa: string) {
  const emails = await getEmailsDoTenant(tenantId);
  if (!emails.length) return;

  const html = base(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Problema no pagamento</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#8888aa;line-height:1.6;">Nao conseguimos processar o pagamento da assinatura de <strong style="color:#ffffff;">${escapeHtml(nomeEmpresa)}</strong>.</p>
    <div style="background:#1a0a0a;border:1px solid #3a1a1a;border-radius:8px;padding:20px 24px;margin-bottom:32px;">
      <p style="margin:0;font-size:14px;color:#ef4444;line-height:1.6;">O acesso ao sistema foi suspenso. Regularize o pagamento para reativar.</p>
    </div>
    <p style="margin:0 0 32px;font-size:14px;color:#8888aa;line-height:1.6;">Entre em contato conosco para resolver e ter o acesso restabelecido.</p>
    <a href="mailto:suporte@flowestoque.com.br" style="display:inline-block;background:#ffffff;color:#080810;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">Entrar em contato</a>
    <p style="margin:32px 0 0;font-size:12px;color:#4a4a6a;">suporte@flowestoque.com.br</p>
  `);

  await enviar(emails, "Problema no pagamento — FlowEstoque", html);
}

export async function enviarEmailContaSuspensa(tenantId: string, nomeEmpresa: string) {
  const emails = await getEmailsDoTenant(tenantId);
  if (!emails.length) return;

  const html = base(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Conta suspensa</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#8888aa;line-height:1.6;">A assinatura de <strong style="color:#ffffff;">${escapeHtml(nomeEmpresa)}</strong> foi encerrada e o acesso ao sistema foi suspenso.</p>
    <div style="background:#1a0a0a;border:1px solid #3a1a1a;border-radius:8px;padding:20px 24px;margin-bottom:32px;">
      <p style="margin:0;font-size:14px;color:#ef4444;line-height:1.6;">Para reativar o acesso, entre em contato com nossa equipe.</p>
    </div>
    <a href="mailto:suporte@flowestoque.com.br" style="display:inline-block;background:#ffffff;color:#080810;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">Entrar em contato</a>
    <p style="margin:32px 0 0;font-size:12px;color:#4a4a6a;">Obrigado por ter utilizado o FlowEstoque.</p>
  `);

  await enviar(emails, "Conta suspensa — FlowEstoque", html);
}
