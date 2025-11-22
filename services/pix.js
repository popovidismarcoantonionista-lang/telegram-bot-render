const { criarCobrancaPix } = require('./paguepix');

// Quando um usuário quiser fazer um pagamento:
async function handlePagamento(chatId, valor, descricao, dadosUsuario) {
  const resultado = await criarCobrancaPix({
    valor: valor * 100, // Converter reais para centavos
    descricao: descricao,
    expiracao: 30, // 30 minutos
    pagadorNome: dadosUsuario.nome,
    pagadorCpf: dadosUsuario.cpf,
    pagadorEmail: dadosUsuario.email
  });
  
  if (resultado.success) {
    // Enviar QR Code para o usuário no Telegram
    await bot.sendMessage(chatId, 
      `💰 *Pagamento PIX Gerado!*\n\n` +
      `Valor: R$ ${(resultado.amount / 100).toFixed(2)}\n` +
      `Expira em: ${resultado.expiration}\n\n` +
      `Use o QR Code abaixo para pagar:`,
      { parse_mode: 'Markdown' }
    );
    
    // Enviar QR Code como imagem ou PIX Copia e Cola
    await bot.sendMessage(chatId, `\`${resultado.qr_code}\``, {
      parse_mode: 'Markdown'
    });
  } else {
    await bot.sendMessage(chatId, 
      `❌ Erro ao gerar pagamento: ${resultado.error}`
    );
  }
}
