# Minha conta · React + Supabase

Aplicação de estudo com cadastro, autenticação real, perfil privado e upload de avatar. Interface minimalista em português, responsiva e navegável por teclado. Não possui backend próprio.

## Tecnologias

React 19, TypeScript, Vite, Tailwind CSS 4, Supabase JS, React Router e Lucide Icons. Vitest para validações.

## Funcionalidades e rotas

| Rota | Função |
| --- | --- |
| `/register` | Nome, e-mail, senha e confirmação; confirmação de e-mail pelo Supabase |
| `/login` | Login real; mostrar/ocultar senha |
| `/forgot-password` | Solicitar recuperação por e-mail |
| `/reset-password` | Definir nova senha com sessão válida do link |
| `/dashboard` | Saudação, e-mail, avatar, data de criação e logout; protegida |
| `/profile` | Editar nome e trocar foto; protegida |

Formulários têm validações, carregamento, bloqueio de reenvio durante requisições e mensagens amigáveis. O SDK restaura/renova a sessão; ao perder a sessão, as páginas privadas redirecionam ao login. Falha de rede mostra opção de tentar novamente.

## Instalação

Use Node.js 22.12+ (ou Node.js 24 LTS) e npm.

```bash
git clone https://github.com/glaydsonaraujo25-cloud/Supabase.git
cd Supabase
npm ci
cp .env.example .env
npm run dev
```

No Windows, copie `.env.example` para `.env` pelo explorador ou use `Copy-Item .env.example .env` no PowerShell. Acesse `http://localhost:5173`.

## Variáveis de ambiente

Em **Supabase → Project Settings → API Keys**, copie a **publishable key**. A URL está nas configurações de API do projeto. Preencha seu `.env`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY
```

O nome `ANON_KEY` é mantido por conveniência: aceita a publishable key atual e a chave legada com papel `anon`. Reinicie o Vite ao alterar variáveis. Nunca use `sb_secret_...` ou `service_role`: qualquer variável `VITE_*` é incorporada ao JavaScript público. O cliente rejeita esses tipos de chave, mas isso não substitui manter segredos fora das variáveis de build. `.env` está no `.gitignore`; apenas `.env.example` deve ser versionado.

## Configuração do Supabase

1. Abra seu projeto no painel do Supabase.
2. Entre em **SQL Editor → New query**.
3. Cole o conteúdo completo de [`supabase/migrations/20260901000000_profiles_and_avatars.sql`](supabase/migrations/20260901000000_profiles_and_avatars.sql) e clique em **Run**.
4. Em **Authentication → Providers → Email**, habilite cadastro por e-mail e mantenha a confirmação de e-mail ativa. Configure senha mínima de 8 caracteres também no servidor.
5. Em **Authentication → URL Configuration**, defina **Site URL** como `http://localhost:5173` durante o desenvolvimento. Adicione às **Redirect URLs**:
   - `http://localhost:5173/login`
   - `http://localhost:5173/reset-password`
6. Na publicação, use o domínio HTTPS real como Site URL e adicione as mesmas duas rotas desse domínio às Redirect URLs. Evite curingas amplos em produção.
7. Confira os templates de confirmação/recuperação: os botões devem usar `{{ .ConfirmationURL }}` para preservar o fluxo de verificação do Supabase.
8. Configure SMTP próprio para enviar a usuários reais. O envio padrão do Supabase tem restrições de destinatários e de frequência; consulte [SMTP personalizado](https://supabase.com/docs/guides/auth/auth-smtp).

A migração já foi aplicada ao projeto conectado durante a implementação. O arquivo SQL permite reproduzir a configuração em outro projeto. Ele preserva perfis existentes e cria somente os ausentes. Em bancos com policies adicionais, revise-as: policies permissivas podem ampliar o acesso.

### Banco e segurança

- `profiles.id` referencia `auth.users.id` com exclusão em cascata.
- Trigger cria o perfil no cadastro e preenche usuários antigos sem perfil.
- RLS restringe leitura e atualização ao próprio ID.
- Usuários autenticados só recebem UPDATE em `full_name` e `avatar_url`; não podem alterar ID nem timestamps, inserir ou excluir perfis diretamente.
- `updated_at` é atualizado pelo servidor; nome e caminho do avatar são validados no trigger.
- Bucket `avatars` é **privado**, limitado a 2 MB e JPG/PNG/WebP.
- Cada arquivo usa `userId/uuid.ext`. Policies de Storage verificam o primeiro diretório tanto na leitura quanto na escrita/exclusão.
- `avatar_url` armazena o **caminho**, não uma URL pública. O cliente baixa a imagem autenticado e cria uma URL local temporária, revogada ao desmontar.
- A foto anterior só é removida após salvar o perfil; se a resposta da atualização falhar, o novo upload é preservado, pois o servidor pode já ter confirmado a alteração. Isso evita apagar a foto em uso. Falhas podem deixar arquivos órfãos privados para limpeza posterior.
- SVG não é aceito. Antes do upload, o navegador tenta decodificar a imagem.
- O frontend não é a barreira de segurança: RLS e grants protegem requisições diretas à API.

O fluxo SPA usa o processamento de links do próprio SDK. `PASSWORD_RECOVERY` leva à redefinição de senha, inclusive se o callback cair em outra rota. Links inválidos/expirados recebem mensagem amigável. Consulte [recuperação de senha](https://supabase.com/docs/guides/auth/passwords).

O verificador do projeto indicou proteção contra senhas vazadas desativada. Habilite-a se disponível no seu plano: [proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Comandos

```bash
npm run dev      # servidor de desenvolvimento
npm run build    # TypeScript + build de produção
npm run preview  # visualizar dist localmente
npm test         # validações e tradução de erros
```

## Publicar na Vercel

Importe o repositório, use o preset Vite, comando `npm run build` e saída `dist`. Configure as duas variáveis de ambiente antes do build. O `vercel.json` permite abrir diretamente as rotas da SPA. Após obter o domínio, ajuste Site URL e Redirect URLs no Supabase e teste os links de e-mail. Este repositório não cria automaticamente um deployment.

## Estrutura para estudo

```text
src/
  components/  # Layout e campos acessíveis
  contexts/    # Sessão e eventos de autenticação
  hooks/       # Consulta do perfil e download autenticado do avatar
  lib/         # Cliente, validações e tradução de erros
  pages/       # Páginas de cada fluxo
  types/       # Tipo Profile
  App.tsx      # Rotas e proteção
  main.tsx     # Inicialização
supabase/migrations/ # Banco, triggers, grants e policies
```

## Roteiro de teste manual

1. Cadastre um e-mail que você controla; confirme pelo link recebido.
2. Entre e confira nome, e-mail e data no dashboard.
3. Altere o nome e selecione uma foto; confira a prévia e salve.
4. Recarregue a página: nome e foto devem permanecer.
5. Saia e abra `/dashboard` e `/profile` diretamente: ambas devem levar ao login.
6. Entre novamente; teste senha errada e recuperação.
7. Abra o e-mail de recuperação, defina uma nova senha e teste o login com ela.
8. Teste link expirado, imagem acima de 2 MB, tipo inválido, perda de conexão e campos vazios.
9. Com uma segunda conta, confirme que não consegue ler/editar o perfil ou baixar a foto da primeira via API.

Build e testes unitários foram executados. O isolamento de perfis foi verificado no banco com duas identidades temporárias dentro de uma transação revertida: trigger, leitura e atualização próprias, bloqueio de atualização alheia e de alteração de ID. Nenhum usuário de teste dessa transação permanece. O recebimento de e-mails e o ciclo completo com uma caixa postal real precisam ser validados após configurar domínio e SMTP.

Também foram verificadas no banco as policies de leitura e inserção de Storage entre duas identidades, com rollback. A revisão visual automatizada não pôde ser executada neste ambiente porque o download do navegador foi bloqueado pela rede.

## Revisão funcional

16 testes automatizados cobrem validações, URLs inválidas, erros de login após links expirados, proteção das rotas privadas, imagem indisponível, troca de avatar, falhas de rede e compatibilidade de decodificação. Os testes de interface usam DOM simulado e os de salvamento usam respostas simuladas do Supabase; não substituem o teste de e-mails e do site publicado.

O cadastro interrompe o fluxo e bloqueia reenvios para o mesmo e-mail quando Auth retorna `user_already_exists`, `email_exists` ou uma resposta sem sessão com `identities: []`. A tela oferece login e recuperação; outro e-mail libera nova tentativa. Contas ainda não confirmadas podem receber novamente as instruções de confirmação conforme o comportamento do Supabase. Não é feita consulta pública à tabela de usuários.
