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
  created_at: string;
  categorias?: Categoria | null;
};

export type Movimentacao = {
  id: string;
  produto_id: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  observacao: string | null;
  created_at: string;
  produtos?: Produto | null;
};

export type EstoqueAtualRow = {
  id: string;
  nome: string;
  codigo: string | null;
  unidade: string;
  preco_custo: number;
  preco_venda: number;
  estoque_minimo: number;
  categoria: string | null;
  estoque_atual: number;
};
