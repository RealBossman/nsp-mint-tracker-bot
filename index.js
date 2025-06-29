require('dotenv').config();
const { Telegraf } = require('telegraf');
const { ethers } = require('ethers');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contractAddress = process.env.CONTRACT_ADDRESS.toLowerCase();
const MINT_METHOD_ID = '0x331d0c9a'; // mintCards(uint256)

provider.on('pending', async (txHash) => {
  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx || !tx.to || tx.to.toLowerCase() !== contractAddress) return;

    if (tx.data.startsWith(MINT_METHOD_ID)) {
      const data = tx.data.slice(10); // Remove method ID
      const amount = ethers.toBigInt(`0x${data}`); // Decode uint256
      const shortWallet = `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`;

      const message = `
🔥 <b>${amount}</b> NSP STAKING CARDS have been minted by <code>${shortWallet}</code>!
🔗 <a href="https://shibariumscan.io/tx/${tx.hash}">View TX</a>
🃏 <a href="https://nsp-staking.vercel.app/">Mint Cards!</a>
🛡️ <a href="https://nsp-staking.vercel.app/stake">Stake Cards!</a>
      `.trim();

      try {
        await bot.telegram.sendPhoto(
          process.env.TELEGRAM_CHAT_ID,
          process.env.IMAGE_URL,
          {
            caption: message,
            parse_mode: 'HTML'
          }
        );
      } catch (err) {
        console.error('❌ Failed to send image, sending text only:', err.message);
        await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, message, {
          parse_mode: 'HTML'
        });
      }
    }
  } catch (err) {
    console.error("Error tracking pending mintCards tx:", err);
  }
});

// Test command
bot.command('testNSPmint', async (ctx) => {
  const testAmount = 5;
  const testWallet = "0x123...abcd";
  const testTx = "https://shibariumscan.io/tx/0xTESTTXHASH";

  const message = `
🔥 <b>${testAmount}</b> NSP STAKING CARDS have been minted by <code>${testWallet}</code>!
🔗 <a href="${testTx}">View TX</a>
  `.trim();

  try {
    await ctx.replyWithPhoto(process.env.IMAGE_URL, {
      caption: message,
      parse_mode: 'HTML'
    });
  } catch (err) {
    console.error('❌ Failed to send test image, sending text only:', err.message);
    ctx.replyWithHTML(message);
  }
});

bot.launch();
console.log("✅ NSP Mint Tracker is watching for mintCards calls...");