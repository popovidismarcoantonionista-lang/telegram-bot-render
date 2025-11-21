app.post('/pix-callback', async (req, res) => {
  try {
    const { status, valor, user_id } = req.body;

    if (status === 'approved' || status === 'paid') {
      const PERCENT_LUCRO = 0.70; // 70% p/ você, 30% p/ créditos
      const valorTotal = parseFloat(valor);
      const valorCredito = Math.floor(valorTotal * (1 - PERCENT_LUCRO) * 100) / 100;

      const { updateUserBalance } = require('./database/supabase');
      await updateUserBalance(user_id, valorCredito);

      await bot.telegram.sendMessage(
        user_id,
        `✅ Pagamento Pix confirmado!\n\n` +
        `💵 Depósito: R$ ${valorTotal.toFixed(2)}\n` +
        `💸 Créditos adicionados: R$ ${valorCredito.toFixed(2)}\n\n` +
        `Seu saldo já está disponível no bot.`
      );

      return res.status(200).json({ success: true });
    }

    res.status(200).json({ message: 'Pagamento não aprovado' });
  } catch (error) {
    console.error('❌ Erro no callback Pix:', error);
    res.status(500).json({ error: error.message });
  }
});
