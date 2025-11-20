function getMainKeyboard() {
  return {
    keyboard: [
      ['💬 Comprar SMS', '👥 Comprar Seguidores'],
      ['💳 Depositar via Pix', '💰 Meu Saldo'],
      ['📞 Suporte']
    ],
    resize_keyboard: true
  };
}

function getBackKeyboard() {
  return {
    keyboard: [
      ['⬅️ Voltar']
    ],
    resize_keyboard: true
  };
}

function getServicesKeyboard() {
  return {
    keyboard: [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['⬅️ Voltar']
    ],
    resize_keyboard: true
  };
}

module.exports = {
  getMainKeyboard,
  getBackKeyboard,
  getServicesKeyboard
};