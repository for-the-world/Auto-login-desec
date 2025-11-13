const axios = require('axios');
const { chromium } = require('playwright');

const token = process.env.BOT_TOKEN;
const chatId = process.env.CHAT_ID;
const accounts = process.env.ACCOUNTS;

if (!accounts) {
  console.log('❌ 未配置账号');
  process.exit(1);
}

// 解析多个账号，支持逗号或分号分隔
const accountList = accounts.split(/[,;]/).map(account => {
  const [user, pass] = account.split(":").map(s => s.trim());
  return { user, pass };
}).filter(acc => acc.user && acc.pass);

if (accountList.length === 0) {
  console.log('❌ 账号格式错误，应为 username1:password1,username2:password2');
  process.exit(1);
}

async function sendTelegram(message) {
  if (!token || !chatId) return;

  const now = new Date();
  const hkTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  const timeStr = hkTime.toISOString().replace('T', ' ').substr(0, 19) + " HKT";

  const fullMessage = `🎉 deSEC 登录通知\n\n登录时间：${timeStr}\n\n${message}`;

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: fullMessage
    }, { timeout: 10000 });
    console.log('✅ Telegram 通知发送成功');
  } catch (e) {
    console.log('⚠️ Telegram 发送失败');
  }
}

async function loginWithAccount(user, pass) {
  console.log(`\n🚀 开始登录账号: ${user}`);
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  let page;
  let result = { user, success: false, message: '' };
  
  try {
    page = await browser.newPage();
    page.setDefaultTimeout(30000);
    
    console.log(`📱 ${user} - 正在访问deSEC登录页面...`);
    await page.goto('https://desec.io/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log(`📝 ${user} - 填写邮箱...`);
    await page.fill('#input-61', user);
    await page.waitForTimeout(1000);
    
    console.log(`🔒 ${user} - 填写密码...`);
    await page.fill('#input-64', pass);
    await page.waitForTimeout(1000);
    
    console.log(`⏳ ${user} - 等待登录按钮变为可用状态...`);
    await page.waitForTimeout(2000);
    
    // 等待按钮变为可用状态（最多等待10秒）
    let buttonClicked = false;
    for (let i = 0; i < 10; i++) {
      try {
        const submitButton = page.locator('text=Log In');
        const buttonClass = await submitButton.getAttribute('class');
        
        if (buttonClass && !buttonClass.includes('v-btn--disabled')) {
          console.log(`🔘 ${user} - 登录按钮已可用，开始点击...`);
          
          // 尝试多种点击方法
          try {
            // 方法1: 使用JavaScript点击（最可靠）
            await page.evaluate(() => {
              document.querySelector("button[type='submit']").click();
            });
            console.log(`✅ ${user} - 使用JavaScript成功点击登录按钮`);
            buttonClicked = true;
            break;
          } catch (e1) {
            console.log(`⚠️ ${user} - JavaScript点击失败，尝试其他方法: ${e1.message}`);
            try {
              // 方法2: 使用Playwright的click方法
              await submitButton.click();
              console.log(`✅ ${user} - 使用Playwright成功点击登录按钮`);
              buttonClicked = true;
              break;
            } catch (e2) {
              console.log(`⚠️ ${user} - Playwright点击失败: ${e2.message}`);
              try {
                // 方法3: 使用hover + click
                await submitButton.hover();
                await page.waitForTimeout(500);
                await submitButton.click();
                console.log(`✅ ${user} - 使用hover+click成功点击登录按钮`);
                buttonClicked = true;
                break;
              } catch (e3) {
                console.log(`❌ ${user} - 所有点击方法都失败: ${e3.message}`);
                break;
              }
            }
          }
        } else {
          console.log(`⏳ ${user} - 按钮仍被禁用，等待中... (${i + 1}/10)`);
          await page.waitForTimeout(1000);
        }
      } catch (e) {
        console.log(`⚠️ ${user} - 检查按钮状态时出错: ${e.message}，重试中... (${i + 1}/10)`);
        await page.waitForTimeout(1000);
      }
    }
    
    if (!buttonClicked) {
      throw new Error('无法点击登录按钮');
    }
    
    console.log(`⏳ ${user} - 等待页面响应登录操作...`);
    await page.waitForTimeout(3000);
    
    // 检查登录是否成功
    const currentUrl = page.url();
    console.log(`🔍 ${user} - 当前页面URL: ${currentUrl}`);
    
    if (currentUrl.includes('desec.io') && !currentUrl.includes('/login')) {
      console.log(`✅ ${user} - 登录成功！已跳转到主页面`);
      result.success = true;
      result.message = `✅ ${user} 登录成功`;
    } else if (currentUrl.includes('/login')) {
      console.log(`❌ ${user} - 登录失败，仍在登录页面`);
      result.message = `❌ ${user} 登录失败，仍在登录页面`;
    } else {
      console.log(`⚠️ ${user} - 无法确定登录状态，请手动检查`);
      result.message = `⚠️ ${user} 无法确定登录状态`;
    }
    
  } catch (e) {
    console.log(`❌ ${user} - 登录异常: ${e.message}`);
    result.message = `❌ ${user} 登录异常: ${e.message}`;
  } finally {
    if (page) await page.close();
    await browser.close();
  }
  
  return result;
}

async function main() {
  console.log(`🔍 发现 ${accountList.length} 个账号需要登录`);
  
  const results = [];
  
  for (let i = 0; i < accountList.length; i++) {
    const { user, pass } = accountList[i];
    console.log(`\n📋 处理第 ${i + 1}/${accountList.length} 个账号: ${user}`);
    
    const result = await loginWithAccount(user, pass);
    results.push(result);
    
    // 如果不是最后一个账号，等待一下再处理下一个
    if (i < accountList.length - 1) {
      console.log('⏳ 等待3秒后处理下一个账号...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // 汇总所有结果并发送一条消息
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  let summaryMessage = `📊 登录汇总: ${successCount}/${totalCount} 个账号成功\n\n`;
  
  results.forEach(result => {
    summaryMessage += `${result.message}\n`;
  });
  
  await sendTelegram(summaryMessage);
  
  console.log('\n✅ 所有账号处理完成！');
}

main().catch(console.error);
