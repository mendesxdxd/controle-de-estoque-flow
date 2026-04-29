import Link from "next/link";

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-black px-6 py-16">
      <div className="max-w-2xl mx-auto flex flex-col gap-10">

        {/* Header */}
        <div className="flex flex-col gap-6">
          <Link href="/login" className="flex items-center gap-3 w-fit">
            <img src="/favicon.svg" alt="FlowStock" className="w-7 h-7" />
            <span className="text-lg font-bold text-white tracking-tight">FlowStock</span>
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-black text-white">Politica de Privacidade</h1>
            <p className="text-sm" style={{ color: "#6b7280" }}>Ultima atualizacao: abril de 2026</p>
          </div>
          <div className="h-px" style={{ background: "#1a1a2e" }} />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-8 text-sm leading-relaxed" style={{ color: "#9ca3af" }}>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-white">1. Introducao</h2>
            <p>Esta Politica de Privacidade descreve como o FlowStock coleta, utiliza e protege os seus dados pessoais, em conformidade com a Lei Geral de Protecao de Dados (LGPD — Lei 13.709/2018).</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-white">2. Dados Coletados</h2>
            <p>Coletamos os seguintes dados para fornecer o servico:</p>
            <ul className="flex flex-col gap-2 pl-4" style={{ listStyleType: "disc" }}>
              <li><span className="text-white font-medium">Dados de cadastro:</span> nome, email e senha (armazenada de forma criptografada)</li>
              <li><span className="text-white font-medium">Dados operacionais:</span> produtos, categorias, movimentacoes de estoque e relatorios inseridos por voce</li>
              <li><span className="text-white font-medium">Dados de acesso:</span> logs de login e uso da plataforma para fins de seguranca</li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-white">3. Finalidade do Uso</h2>
            <p>Seus dados sao utilizados exclusivamente para:</p>
            <ul className="flex flex-col gap-2 pl-4" style={{ listStyleType: "disc" }}>
              <li>Fornecer e manter o funcionamento do servico</li>
              <li>Autenticar seu acesso e garantir a seguranca da conta</li>
              <li>Enviar comunicacoes relacionadas ao servico (recuperacao de senha, notificacoes)</li>
              <li>Melhorar a plataforma com base no uso agregado e anonimizado</li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-white">4. Compartilhamento de Dados</h2>
            <p>Nao vendemos nem compartilhamos seus dados pessoais com terceiros, exceto com provedores de infraestrutura essenciais para o funcionamento do servico (como hospedagem e banco de dados), que estao sujeitos a obrigacoes contratuais de confidencialidade.</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-white">5. Armazenamento e Seguranca</h2>
            <p>Os dados sao armazenados em servidores seguros com criptografia em repouso e em transito. Utilizamos autenticacao com controle de acesso por perfil (RLS) para garantir que cada empresa acesse apenas seus proprios dados.</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-white">6. Retencao de Dados</h2>
            <p>Seus dados sao mantidos enquanto sua conta estiver ativa. Ao solicitar o encerramento da conta, seus dados serao excluidos em ate 30 dias, salvo obrigacao legal de retencao.</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-white">7. Seus Direitos (LGPD)</h2>
            <p>Como titular dos dados, voce tem direito a:</p>
            <ul className="flex flex-col gap-2 pl-4" style={{ listStyleType: "disc" }}>
              <li>Confirmar a existencia de tratamento dos seus dados</li>
              <li>Acessar, corrigir ou atualizar seus dados</li>
              <li>Solicitar a exclusao dos dados pessoais</li>
              <li>Revogar o consentimento a qualquer momento</li>
              <li>Solicitar portabilidade dos dados</li>
            </ul>
            <p>Para exercer seus direitos, entre em contato pelo email indicado abaixo.</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-white">8. Cookies</h2>
            <p>Utilizamos cookies de sessao exclusivamente para manter voce autenticado durante o uso da plataforma. Nao utilizamos cookies de rastreamento ou publicidade.</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-white">9. Alteracoes nesta Politica</h2>
            <p>Podemos atualizar esta politica periodicamente. Notificaremos sobre mudancas significativas por email ou por aviso na plataforma. Recomendamos revisar esta pagina regularmente.</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-white">10. Contato</h2>
            <p>Para duvidas, solicitacoes ou exercicio dos seus direitos como titular, entre em contato:</p>
            <p>Email: <span className="text-white">contato@flowestoque.com.br</span></p>
          </section>

        </div>

        {/* Footer */}
        <div className="flex flex-col gap-4 pt-4" style={{ borderTop: "1px solid #1a1a2e" }}>
          <Link
            href="/termos"
            className="text-sm hover:text-white transition-colors duration-150"
            style={{ color: "#6b7280" }}
          >
            Ver Termos de Uso
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold text-white hover:opacity-80 transition-opacity w-fit"
          >
            Voltar ao login
          </Link>
        </div>

      </div>
    </div>
  );
}
