# Selic Saver

Uma extensão para Chrome que calcula quanto seu dinheiro renderia na Selic enquanto você compra online.

## Funcionalidades

- Detecta automaticamente preços em sites de e-commerce
- Calcula quanto você ganharia investindo esse valor na taxa Selic
- Mostra os rendimentos em diferentes períodos (1 mês, 6 meses, 1 ano)
- Interface simples e intuitiva

## Como funciona

A extensão funciona detectando preços nas páginas de e-commerce que você visita. Para cada preço encontrado, a extensão calcula quanto esse dinheiro renderia se fosse investido na taxa Selic atual, em vez de ser gasto na compra.

## Instalação

### Para desenvolvimento

1. Clone este repositório:

   ```sh
   git clone https://github.com/seu-usuario/selic-saver.git
   cd selic-saver
   ```

2. Instale as dependências:

   ```sh
   npm install
   ```

3. Gere os ícones (opcional, requer um ambiente com Node.js >= 18):

   ```sh
   npm run generate-icons
   ```

   Alternativamente, use o arquivo `public/icons/generate.html` para criar manualmente os ícones.

4. Compile a extensão:

   ```sh
   npm run build
   ```

5. Carregue a extensão no Chrome:
   - Abra `chrome://extensions/`
   - Ative o "Modo de desenvolvedor"
   - Clique em "Carregar sem compactação"
   - Selecione a pasta `dist` criada pelo build

### Para usuários

1. Baixe a última versão da extensão em [Releases](https://github.com/seu-usuario/selic-saver/releases)
2. Descompacte o arquivo
3. Siga as etapas 5 a 7 acima para carregar a extensão no Chrome

## Desenvolvimento

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila a extensão para produção
- `npm run generate-icons` - Gera os ícones da extensão

## Tecnologias

- React
- TypeScript
- Vite
- Chrome Extension API

## Limitações

- A extensão utiliza uma versão simplificada da taxa Selic
- A detecção de preços pode não funcionar em todos os sites de e-commerce
- Os cálculos são aproximados e não consideram impostos ou outras deduções

## Licença

MIT
