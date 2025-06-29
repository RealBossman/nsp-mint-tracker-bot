require('dotenv').config();
const { Telegraf } = require('telegraf');
const { ethers } = require('ethers');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contractAddress = process.env.CONTRACT_ADDRESS;

const abi = [
  "event CardMinted(address indexed minter, uint256 amount, uint256 boneSpent)"
];

const contract = new ethers.Contract(contractAddress, abi, provider);

let lastMint = null;
let totalMints = 0;

contract.on("CardMinted", async (minter, amount, boneSpent, event) => {
  const txHash = event.transactionHash;
  const shortWallet = `${minter.slice(0, 6)}...${minter.slice(-4)}`;
  const bone = ethers.formatEther(boneSpent);

  const message = `
🦊 Wallet <code>${shortWallet}</code> minted <b>${amount}</b> NSP Staking Cards for <b>${bone}</b> $BONE
🔗 <a href="https://shibariumscan.io/tx/${txHash}">TX Link</a>
  `.trim();

  lastMint = message;
  totalMints += parseInt(amount);

  await bot.telegram.sendPhoto(
    process.env.TELEGRAM_CHAT_ID,
    process.env.IMAGE_URL,
    {
      caption: message,
      parse_mode: "HTML"
    }
  );
});

bot.command('lastmint', (ctx) => {
  if (lastMint) {
    ctx.replyWithHTML(lastMint);
  } else {
    ctx.reply('No mints tracked yet.');
  }
});

bot.command('totalmints', (ctx) => {
  ctx.reply(`Total NSP Staking Cards minted: ${totalMints}`);
});

bot.launch();
console.log("✅ NSP Mint Tracker Bot with Image running...");
