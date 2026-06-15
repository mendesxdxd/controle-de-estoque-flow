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
  created_at: string;
  produtos?: Produto | null;
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
