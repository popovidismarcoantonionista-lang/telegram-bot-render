const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser(userId, username) {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(
        { 
          user_id: userId.toString(), 
          username: username,
          balance: 0 
        },
        { onConflict: 'user_id' }
      );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw error;
  }
}

async function getUserBalance(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('balance')
      .eq('user_id', userId.toString())
      .single();

    if (error) throw error;
    return data?.balance || 0;
  } catch (error) {
    console.error('Erro ao buscar saldo:', error);
    return 0;
  }
}

async function updateUserBalance(userId, amount) {
  try {
    const currentBalance = await getUserBalance(userId);
    const newBalance = currentBalance + amount;

    const { data, error } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('user_id', userId.toString());

    if (error) throw error;

    // Registrar transação
    await supabase
      .from('transactions')
      .insert({
        user_id: userId.toString(),
        amount: amount,
        type: amount > 0 ? 'deposit' : 'purchase',
        description: amount > 0 ? 'Depósito via Pix' : 'Compra de serviço'
      });

    return newBalance;
  } catch (error) {
    console.error('Erro ao atualizar saldo:', error);
    throw error;
  }
}

module.exports = {
  createUser,
  getUserBalance,
  updateUserBalance
};