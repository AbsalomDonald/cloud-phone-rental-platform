# GitHub 上传测试说明

## 1. 确认不要上传的内容

以下内容已经写入 `.gitignore`，不要提交到 GitHub：

```text
node_modules
.next
.npm-cache
.env
.env.local
.vercel
*.log
*.err
*.zip
tsconfig.tsbuildinfo
coverage
```

## 2. 初始化并上传

在项目根目录运行：

```powershell
git init
git branch -M main
git add .
git commit -m "Initial VMOS cloud phone platform MVP"
git remote add origin https://github.com/你的账号/你的仓库名.git
git push -u origin main
```

如果 `git branch -M main` 提示安全目录问题，先运行：

```powershell
git config --global --add safe.directory "C:/Users/user/Documents/Codex/2026-05-05/codex-1-cloud-phone-rental-platform"
```

然后重新运行上传命令。

## 3. GitHub 自动测试

项目已经包含 `.github/workflows/ci.yml`。上传后 GitHub 会自动执行：

```text
npm ci
npm run lint
npx tsc --noEmit --pretty false
npm run build
```

看到绿色通过后，说明代码基础构建没有问题。

## 4. 部署前环境变量

正式部署时不要使用 `.env.example` 里的默认值。需要在 Vercel 或服务器里设置真实变量：

```text
DATABASE_URL
AUTH_SECRET
SETTINGS_SECRET
NEXT_PUBLIC_APP_URL
VMOS_API_BASE_URL
VMOS_H5_BASE_URL
VMOS_ACCESS_KEY
VMOS_SECRET_KEY
```
