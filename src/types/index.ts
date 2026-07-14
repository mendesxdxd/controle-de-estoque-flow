export type Categoria = {
  id: string;
  nome: string;
  descricao: string | null;
  created_at: string;
};

export type Produto = {
  id: string;
  nome: string;
  codigo: string | null;
  categoria_id: string | null;
  unidade: string;
  preco_custo: number;
  preco_venda: number;
  estoque_minimo: number;
  caixas_por_palete: number | null;
  created_at: string;
  categorias?: Categoria | null;
};

export type Movimentacao = {
  id: string;
  produto_id: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  observacao: string | null;
  nota_fiscal: string | null;
  transportadora: string | null;
  nota_id?: string | null;
  baixa_id?: string | null;
  created_at: string;
  produtos?: Produto | null;
};

export type NotaTipo = "produto" | "palete";

export type OrdemFrete = {
  id: string;
  tenant_id: string;
  numero: string;
  observacao: string | null;
  user_id: string | null;
  created_at: string;
  notas?: Nota[];
};

export type Nota = {
  id: string;
  of_id: string;
  tenant_id: string;
  tipo: NotaTipo;
  numero: string | null;
  nf_palete: string | null;
  produto_id: string | null;
  quantidade_inicial: number;
  observacao: string | null;
  user_id: string | null;
  created_at: string;
  produtos?: Produto | null;
};

export type NotaBaixa = {
  id: string;
  nota_id: string;
  tenant_id: string;
  quantidade: number;
  observacao: string | null;
  user_id: string | null;
  created_at: string;
};

export type NotaSaldo = {
  nota_id: string;
  of_id: string;
  tenant_id: string;
  tipo: NotaTipo;
  numero: string | null;
  produto_id: string | null;
  quantidade_inicial: number;
  total_baixado: number;
  saldo: number;
  created_at: string;
};

export type EstoqueAtualRow = {
  id: string;
  user_id: string;
  tenant_id: string;
  nome: string;
  codigo: string | null;
  unidade: string;
  preco_custo: number;
  preco_venda: number;
  estoque_minimo: number;
  caixas_por_palete: number | null;
  categoria: string | null;
  estoque_atual: number;
};
