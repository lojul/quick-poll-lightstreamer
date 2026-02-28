# Supabase Email Templates for 貓爪達人投票社

Apply these templates at: https://supabase.com/dashboard/project/shblpehddhzjvhmqhxkz/auth/templates

---

## 1. Confirm Signup (確認註冊)

### Subject
```
歡迎加入貓爪達人投票社！請驗證您的電子郵件
```

### Body
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); padding: 30px; text-align: center;">
              <div style="font-size: 40px; margin-bottom: 10px;">🐾</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">貓爪達人投票社</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">CatPawVote</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">歡迎加入！</h2>
              <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 25px 0;">
                感謝您註冊貓爪達人投票社！請點擊下方按鈕驗證您的電子郵件，即可開始建立投票。
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      驗證電子郵件
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #888888; font-size: 13px; line-height: 1.5; margin: 30px 0 0 0;">
                如果按鈕無法點擊，請複製以下連結到瀏覽器：<br>
                <a href="{{ .ConfirmationURL }}" style="color: #9333ea; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 30px; border-top: 1px solid #eee;">
              <p style="color: #888888; font-size: 12px; margin: 0; text-align: center;">
                此郵件由貓爪達人投票社系統自動發送。<br>
                如果您沒有註冊帳戶，請忽略此郵件。
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Magic Link (魔法連結登入)

### Subject
```
貓爪達人投票社 - 您的登入連結
```

### Body
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); padding: 30px; text-align: center;">
              <div style="font-size: 40px; margin-bottom: 10px;">🐾</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">貓爪達人投票社</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">CatPawVote</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">一鍵登入</h2>
              <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 25px 0;">
                點擊下方按鈕即可登入您的帳戶，無需輸入密碼。
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      登入帳戶
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #888888; font-size: 13px; line-height: 1.5; margin: 30px 0 0 0;">
                如果按鈕無法點擊，請複製以下連結到瀏覽器：<br>
                <a href="{{ .ConfirmationURL }}" style="color: #9333ea; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 30px; border-top: 1px solid #eee;">
              <p style="color: #888888; font-size: 12px; margin: 0; text-align: center;">
                此連結將在 24 小時後失效。<br>
                如果您沒有請求登入，請忽略此郵件。
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Change Email Address (更改電子郵件)

### Subject
```
貓爪達人投票社 - 確認您的新電子郵件地址
```

### Body
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); padding: 30px; text-align: center;">
              <div style="font-size: 40px; margin-bottom: 10px;">🐾</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">貓爪達人投票社</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">CatPawVote</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">確認新電子郵件</h2>
              <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 25px 0;">
                您已請求將帳戶電子郵件更改為此地址。請點擊下方按鈕確認更改。
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      確認更改
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #888888; font-size: 13px; line-height: 1.5; margin: 30px 0 0 0;">
                如果按鈕無法點擊，請複製以下連結到瀏覽器：<br>
                <a href="{{ .ConfirmationURL }}" style="color: #9333ea; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 30px; border-top: 1px solid #eee;">
              <p style="color: #888888; font-size: 12px; margin: 0; text-align: center;">
                如果您沒有請求更改電子郵件，請立即聯繫我們。<br>
                您的帳戶安全對我們非常重要。
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Reset Password (重設密碼)

### Subject
```
貓爪達人投票社 - 重設您的密碼
```

### Body
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); padding: 30px; text-align: center;">
              <div style="font-size: 40px; margin-bottom: 10px;">🐾</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">貓爪達人投票社</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">CatPawVote</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">重設密碼</h2>
              <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 25px 0;">
                我們收到了您的密碼重設請求。點擊下方按鈕設定新密碼。
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      重設密碼
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #888888; font-size: 13px; line-height: 1.5; margin: 30px 0 0 0;">
                如果按鈕無法點擊，請複製以下連結到瀏覽器：<br>
                <a href="{{ .ConfirmationURL }}" style="color: #9333ea; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 30px; border-top: 1px solid #eee;">
              <p style="color: #888888; font-size: 12px; margin: 0; text-align: center;">
                此連結將在 24 小時後失效。<br>
                如果您沒有請求重設密碼，請忽略此郵件。
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Template Variables

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | Verification/action link |
| `{{ .Email }}` | User's email address |
| `{{ .Token }}` | Verification token |
| `{{ .TokenHash }}` | Hashed token |
| `{{ .SiteURL }}` | Your site URL |

## Design Notes

- **Theme Color**: Purple (#9333ea → #7c3aed gradient)
- **Logo**: Cat paw emoji 🐾
- **Brand**: 貓爪達人投票社 / CatPawVote
- **Mobile**: Responsive table-based layout
- **Font**: System fonts for best compatibility
