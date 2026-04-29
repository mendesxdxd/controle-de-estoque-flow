import Link from "next/link";

export default function TermosPage() {
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
            <h1 className="text-2xl font-black text-white">Termos de Uso</h1>
            <p className="text-sm" style={{ color: "#6b7280" }}>Ultima atualizacao: abril de 2026</p>
          </div>
          <div className="h-px" style={{ background: "#1a1a2e" }} />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-8 text-sm leading-relaxed" style={{ color: "#9ca3af" }}>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-white">1. Aceitacao dos Termos</h2>
            <p>Ao acessar ou utilizar o FlowStock, voce concorda com estes Termos de Uso. Se nao concordar com qualquer parte destes termos, nao utilize o servico.</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-white">2. Descricao do Servico</h2>
            <p>O FlowStock e um sistema de controle de estoque voltado para empresas. O servico permite o cadastro de produtos, registro de movimentacoes (entradas e saidas), geracao de relatorios e visualizacao de dados em tempo real.</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-white">3. Cadastro e Conta</h2>
            <p>Para utilizar o FlowStock, e necessario criar uma conta com email e senha validos. Voce e responsavel por manter a confidencialidade das suas credenciais e por todas as atividades realizadas em sua conta.</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-white">4. Uso Aceitavel</h2>
            <p>Voce concorda em utilizar o FlowStock apenas para fins licitos e de acordo com estes termos. E proibido:</p>
            <ul className="flex flex-col gap-2 pl-4" style={{ listStyleType: "disc" }}>
              <li>Utilizar o servico para fins ilegais ou nao autorizados</li>
              <li>Tentar acessar dados de outros usuarios ou tenants</li>
              <li>Realizar engenharia reversa ou modificar o software</li>
              <li>Transmitir conteudo malicioso ou prejudicial</li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-white">5. Dados e Privacidade</h2>
            <p>O tratamento dos seus dados pessoais e regido pela nossa <Link href="/privacidade" className="text-white underline underline-offset-2 hover:opacity-80 transition-opacity">Politica de Privacidade</Link>, em conformidade com a Lei Geral de Protecao de Dados (LGPD — Lei 13.709/2018).</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-white">6. Disponibilidade do Servico</h2>
            <p>Nos nos empenhamos em manter o FlowStock disponivel continuamente, mas nao garantimos disponibilidade ininterrupta. Podemos realizar manutencoes programadas com aviso previo sempre que possivel.</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-white">7. Propriedade Intelectual</h2>
            <p>Todo o conteudo, codigo, design e funcionalidades do FlowStock sao de propriedade exclusiva dos seus desenvolvedores. E vedada a copia, distribuicao ou uso nao autorizado de qualquer parte do servico.</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-white">8. Limitacao de Responsabilidade</h2>
            <p>O FlowStock e fornecido "no estado em que se encontra". Nao nos responsabilizamos por perdas de dados, interrupcoes de servico ou danos indiretos decorrentes do uso da plataforma, na maxima extensao permitida pela legislacao aplicavel.</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-white">9. Alteracoes nos Termos</h2>
            <p>Reservamo-nos o direito de modificar estes termos a qualquer momento. Alteracoes significativas serao comunicadas por email ou por aviso na plataforma. O uso continuado apos a notificacao implica na aceitacao dos novos termos.</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-white">10. Contato</h2>
            <p>Em caso de duvidas sobre estes termos, entre em contato pelo email: <span className="text-white">contato@flowestoque.com.br</span></p>
          </section>

        </div>

        {/* Footer */}
        <div className="flex flex-col gap-4 pt-4" style={{ borderTop: "1px solid #1a1a2e" }}>
          <Link
            href="/privacidade"
            className="text-sm hover:text-white transition-colors duration-150"
            style={{ color: "#6b7280" }}
          >
            Ver Politica de Privacidade
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
