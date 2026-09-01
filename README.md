# Meus estudos · React + Supabase

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

## Central de estudos — primeira etapa

- `/courses`: criar, editar e excluir cursos; instituição, carga horária, link, progresso, busca e filtro de status.
- `/tasks`: tarefas independentes ou vinculadas a cursos; prazo, prioridade, status, conclusão/reabertura, edição, exclusão e busca.
- `/dashboard`: cursos em andamento, tarefas pendentes, progresso médio dos cursos e próximos prazos (inclui atrasados).
- Navegação responsiva entre Resumo, Cursos, Tarefas e Perfil.

O progresso do curso é informado manualmente; concluir tarefas não muda esse percentual. Excluir um curso também exclui suas tarefas, com confirmação explícita na interface. Datas de prazo seguem o calendário local, sem deslocamento por UTC.

O SQL `supabase/study_setup.sql` já foi aplicado ao projeto conectado pela migração remota `study_courses_and_tasks`. Para reproduzir em outro projeto, execute-o uma única vez no SQL Editor após configurar o esquema de perfis. O arquivo de setup foi mantido separado porque o CLI não pôde executar neste ambiente.

As tabelas `courses` e `tasks` têm RLS em todas as operações, grants explícitos e índices por proprietário. O cliente não pode alterar IDs, proprietários ou timestamps. A chave estrangeira composta impede vincular uma tarefa ao curso de outra pessoa. O teste `supabase/tests/study_access.sql` verifica CRUD, isolamento, vínculo entre proprietários, cascata e bloqueio de visitantes numa transação com rollback.

Validação desta etapa: 32 testes automatizados aprovados, TypeScript e build de produção aprovados; teste de isolamento executado no Supabase. Testes de interface usam DOM simulado; a inspeção visual em navegador não foi executada por indisponibilidade do navegador neste ambiente. Anotações e certificados ficam para a próxima etapa.

## Página do curso: módulos, aulas e anotações

Clique no nome de um curso em `/courses` para abrir `/courses/:courseId`.

- Crie, edite e exclua módulos e aulas. O campo Ordem define a sequência; empates seguem a criação.
- Marque aulas como concluídas ou reabra-as.
- Em Preferências do curso, ative o progresso automático. Ele corresponde a aulas concluídas / total de aulas; sem aulas, é 0%. O modo manual continua disponível e seu valor é preservado.
- Registre a descrição do curso e anotações privadas com título e conteúdo em texto simples.
- Consulte as tarefas vinculadas na mesma página.
- Excluir um módulo remove suas aulas; excluir o curso remove módulos, aulas, anotações e tarefas. A interface pede confirmação.

Aplique `supabase/course_details_setup.sql` uma única vez após `study_setup.sql` em um novo projeto. Já aplicado no projeto conectado. A view `study_courses` usa `security_invoker=true`, respeita RLS e calcula o progresso no momento da consulta, inclusive nas listas e no dashboard. A tabela `courses.progress` guarda apenas o percentual manual. As chaves estrangeiras compostas garantem que curso, módulo, aula e proprietário sejam consistentes. Visitantes não têm permissão de leitura e usuários não podem alterar proprietários, IDs ou vínculos existentes.

Validação: 39 testes, TypeScript e build aprovados. `supabase/tests/course_details_access.sql` executado com rollback comprova cálculo automático, retorno ao manual, isolamento de proprietários, vínculo protegido e exclusão em cascata. Interface verificada em DOM simulado; sem inspeção visual de navegador real nesta entrega. O advisory de proteção contra senhas vazadas continua sendo uma configuração de Auth: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## hCaptcha em cadastro, login e recuperação

Os três formulários exigem a conclusão do hCaptcha e enviam `options.captchaToken` ao Supabase Auth. Tokens são apagados após cada tentativa e ao expirar; erro de carregamento bloqueia o envio e oferece recarregar a verificação. A aplicação não chama `siteverify` no navegador e não guarda o token.

A sitekey pública fornecida para este projeto está em `src/components/Captcha.tsx`. Pode ser substituída com `VITE_HCAPTCHA_SITE_KEY` no ambiente de build. A chave secreta nunca deve ir para variáveis VITE, código, README ou GitHub.

**Ativação necessária no servidor (não efetuada pela integração de código):**

1. No hCaptcha, registre o hostname real `supabase-two-ivory.vercel.app` no site correspondente à sitekey; inclua outros domínios usados para login, se necessário. O modo Demo da página de exemplos não protege a aplicação. Não use sitekeys de teste em produção.
2. Se uma chave secreta foi exposta em prints, substitua-a no painel do hCaptcha.
3. No Supabase, abra Authentication / Bot and Abuse Protection (a localização pode variar), ative CAPTCHA protection, selecione hCaptcha e salve a chave secreta atual diretamente no painel.
4. Teste login, cadastro e recuperação resolvendo o desafio manualmente. Sem CAPTCHA protection no Supabase, o bloqueio da interface sozinho não impede chamadas diretas à API.
5. Se trocar a sitekey, atualize VITE_HCAPTCHA_SITE_KEY na Vercel e publique novamente. Não é necessário mudar a sitekey apenas porque a chave secreta foi substituída, salvo orientação do provedor.

Referência: https://supabase.com/docs/guides/auth/auth-captcha

44 testes automatizados e build aprovados. Os desafios são simulados nos testes; a validação real de hCaptcha e Supabase depende da ativação no painel e de um teste humano. CAPTCHA não remove limites de envio de e-mails nem substitui SMTP.

## Certificados privados e calendário

- `/certificates`: upload de PDF, JPG, PNG e WebP até 10 MB; título, instituição, horas, emissão e curso opcional; busca, edição, visualização, download e exclusão confirmada.
- `/calendar`: calendário mensal com tarefas por dia, hoje, semana, atrasadas ou sem prazo; conclusão e reagendamento. “Nova tarefa” já preenche o dia selecionado.
- As duas rotas exigem sessão. Os arquivos usam um bucket **privado** e download autenticado, sem URL pública. RLS restringe registros e caminhos ao usuário proprietário. Vincular certificados a cursos de outra conta é bloqueado pela chave estrangeira composta.
- Excluir um curso preserva seus certificados e remove apenas o vínculo. Para trocar o arquivo, adicione o novo certificado antes de excluir o antigo.

Em outro projeto Supabase, execute `supabase/certificates_setup.sql` uma vez no **SQL Editor**, depois dos scripts de cursos. O calendário usa a tabela `tasks` existente. Não há novas variáveis de ambiente.

Execute `supabase/tests/certificates_access.sql` no SQL Editor para verificar isolamento entre duas contas, acesso anônimo, caminhos privados e preservação após excluir um curso. Os registros de teste são revertidos ao final. `npm test` também verifica datas, limites de upload, falhas de rede e rotas protegidas.

Upload e metadados não formam uma transação única: em uma falha de rede ambígua, o arquivo enviado é preservado para evitar apagar um upload já associado a um registro. Podem existir arquivos privados órfãos; sua limpeza administrativa deve confirmar antes que não há registro associado. Uma falha de limpeza após excluir um registro é informada na tela.

A prévia de PDF depende do suporte do navegador; o download permanece disponível. Build, testes automatizados e policies foram verificados; esta atualização não teve teste visual em navegador real neste ambiente.

## Exportação dos estudos

Use **Exportar resultados (CSV)** em Cursos, Tarefas ou Certificados. O arquivo contém os resultados dos filtros atuais, com cabeçalhos em português, separador ponto e vírgula e UTF-8. Na importação em uma planilha, selecione esse separador. Campos que poderiam executar fórmulas são tratados como texto. O relatório de certificados contém metadados, sem arquivos, caminhos privados ou identificadores de usuário.

No Calendário, **Exportar prazos (ICS)** baixa as tarefas pendentes com data da visualização atual. Cada prazo vira um evento de dia inteiro, no formato [iCalendar RFC 5545](https://www.rfc-editor.org/rfc/rfc5545). Importe o arquivo usando a opção de importação de seu calendário. É uma cópia pontual: alterações posteriores e exclusões no app não atualizam o calendário externo. Reimportações podem duplicar eventos conforme o serviço utilizado.

As exportações são geradas no navegador com os registros já carregados para a conta atual. Respeitam o limite de resultados configurado na API; não constituem backup completo da conta. Não exigem novas tabelas, permissões ou credenciais. A proteção das rotas e as policies existentes continuam valendo.
