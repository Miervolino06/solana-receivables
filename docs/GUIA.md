# Receba pagamentos SOL com um link e um comprovante verificável

O Receivables transforma um pedido de pagamento em um link ou QR code. A pessoa que vai pagar confere os detalhes e autoriza a transferência na própria carteira. Depois, o app consulta a Solana para verificar se aquela transferência corresponde ao pedido.

**A versão publicada agora é uma demonstração na Devnet.** SOL de teste não tem valor econômico. O app ainda não oferece recebimentos comerciais na rede principal (Mainnet).

[Abrir o site](https://solana-receivables.vercel.app/) · [Abrir a área de trabalho](https://solana-receivables.vercel.app/app) · [English README](../README.md)

## Para que serve

Quando você já recebe cripto, o desafio não é aprender o que é uma carteira: é mandar à pessoa certa os dados certos e conseguir conferir o pagamento depois. Um pedido do Receivables reúne destinatário, valor e referência num link compartilhável. A conferência procura na rede uma transferência que combine com esses dados; o comprovante resultante pode ser compartilhado e as solicitações podem ser exportadas em CSV.

> **Exemplo ilustrativo, não é pagamento real:** você combina um teste de **0,01 SOL de Devnet** por um serviço. Cria o pedido, envia o link ao pagador e ele abre a tela de revisão. O app mostra o destinatário, o valor e a estimativa da taxa da rede antes de abrir a carteira para autorização. A carteira pede aprovação para assinar a transferência. Após a assinatura, o Receivables consulta a transação. Se os dados conferirem, gera um recibo que qualquer pessoa pode verificar sem conectar uma carteira.

Um link claro e um comprovante fácil de conferir podem reduzir a troca de mensagens para confirmar um pagamento e ajudar a apresentar um fluxo mais profissional a clientes. Esse é um benefício possível do produto, ainda não validado com clientes.

## Comece com um teste

1. Abra a [área de trabalho](https://solana-receivables.vercel.app/app) e conecte uma carteira configurada para **Solana Devnet**. Conectar a carteira é uma facilidade de acesso à interface. Isso não prova sua identidade por assinatura e não transfere SOL.
2. Crie uma solicitação com o endereço da carteira que vai receber, um valor pequeno como **0,01 SOL de teste**, e uma descrição que ajude a reconhecer o pedido. O app prepara um link e um QR. Salve o link: os pedidos ficam no armazenamento local deste navegador, não em uma conta sincronizada na nuvem.
3. Use uma segunda carteira como pagador. Abra o link, confira o endereço, o valor e a taxa estimada. A simulação ajuda a verificar a transação antes do envio; só a aprovação explícita na carteira assina e transmite o pagamento.
4. Depois do envio, aguarde a consulta à rede. O app só marca como recebido quando verifica a assinatura e confere destinatário, valor, referência e Memo com o pedido. Abra e compartilhe o recibo ou exporte a atividade em CSV.

Para obter SOL de teste, use o [faucet oficial da Solana](https://faucet.solana.com/), se estiver disponível. Não coloque sua frase-semente ou chave privada no site. Mantenha o teste na Devnet: SOL de teste não pode ser tratado como dinheiro.

## Taxas em linguagem direta

- **Taxa do Receivables:** nenhuma taxa da plataforma é cobrada neste fluxo.
- **Taxa da rede Solana:** a rede pode cobrar uma pequena taxa pela transação. O app consulta um serviço RPC e mostra a estimativa separadamente do valor a receber, antes de abrir a carteira para autorização. A taxa final pode variar.
- **Total que sai da carteira:** valor do pedido mais a taxa da rede exibida. Confira o total na sua carteira antes de aprovar.

## O que é SOL, carteira e Devnet?

**SOL** é o ativo nativo da rede Solana e pode ser usado para pagar a taxa de uma transação. Uma **carteira** guarda as chaves que permitem autorizar operações; o Receivables não recebe sua chave privada. A **Devnet** é uma rede separada da rede principal, usada para testar aplicativos com SOL sem valor econômico.

## O que o comprovante demonstra

O recibo apresenta evidências consultadas na blockchain: uma assinatura válida e uma transação confirmada que combina com o pedido quanto ao destinatário, valor, referência e Memo. Assim, alguém que receba o link pode conferir se a transferência indicada corresponde ao pedido.

Isso demonstra uma transferência na Devnet. Não demonstra quem é a pessoa por trás de uma carteira, que um serviço foi entregue, que houve uma nota fiscal ou que houve um recebimento comercial em Mainnet. O nome mostrado no pedido é informado por quem o criou, e os dados do link e do Memo são públicos para quem tiver acesso a eles. Evite incluir informações privadas.

## Limites a conhecer

- Os pedidos e dicas de assinatura são guardados localmente no navegador, até 40 por área de trabalho. Limpar os dados do navegador, trocar de dispositivo ou perfil pode remover esse histórico. Guarde os links e exporte o CSV; isso não substitui um backup.
- O app pode mostrar estados pendentes ou erro de consulta. Eles não significam que o pagamento foi recebido. Uma dica de assinatura salva no navegador também não é prova por si só.
- SOL de Devnet não tem valor econômico e a Devnet pode ser reiniciada. Transferências nativas são irreversíveis, e transações que falham podem cobrar taxa.
- O Receivables não é uma conta multiusuário protegida, sistema fiscal, custódia ou garantia de entrega. Pagamentos simultâneos para um mesmo pedido em dispositivos diferentes ainda podem ocorrer.

## Para quem presta serviços

Se este fluxo vier a ser disponibilizado para pagamentos reais, um link de cobrança acompanhado de prova verificável poderá facilitar a confirmação entre prestador e cliente. Por enquanto, use o produto publicado apenas para conhecer o fluxo na Devnet; não envie pedidos como se fossem cobranças comerciais. O teste assinado em Devnet e o vídeo de demonstração ainda estão pendentes como evidências do projeto.

Para configuração, programas on-chain, execução local, proveniência e estado da validação, consulte o [README técnico em inglês](../README.md) e as notas de [limites de verificação](VERIFICATION.md).
