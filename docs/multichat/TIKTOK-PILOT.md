# TikTok LIVE — sessões por usuário

Cada usuário autenticado do portal possui uma sessão independente. O worker mantém navegador Chromium, display X com autenticação própria, usuário Linux, fila de comandos e armazenamento criptografado separados. A chave de cada arquivo deriva do ID autenticado; arquivos não podem ser trocados entre contas.

O login usa um link aleatório de 256 bits, válido por 15 minutos. O gateway aceita somente a origem configurada e encaminha à tela do dono do link. Abrir um novo link revoga o anterior. Confirmar, enviar ou desvincular encerra o acesso remoto, inclusive conexões já abertas. Não há senha VNC compartilhada; portas VNC internas ficam em loopback.

## Uso local
No diretório do portal execute:
```powershell
.\scripts\start-tiktok-pilot.ps1
```

No portal entre com Twitch, abra Configurações > TikTok LIVE > Abrir login, acesse seu navegador exclusivo, faça login no TikTok e confirme no portal. Repita com outro usuário do portal em outro perfil/janela de navegação. Desvincular uma conta remove somente a sessão dela.

O limite de processos simultâneos é configurável em TIKTOK_MAX_SESSIONS (padrão: 4). Sessões salvas podem superar esse limite; a capacidade é consumida por navegadores ativos. Desvincular libera a vaga. Não há cobrança ou quota Euler.

TIKTOK_LOGIN_PUBLIC_URL é http://localhost:6080 para testes nesta máquina. Para usuários em outros computadores, é necessário publicar o gateway em HTTPS e configurar essa URL. A configuração atual continua acessível somente por loopback; não foi publicada na Internet. Nenhum callback OAuth é necessário para este fluxo.

## Testes
- Testes de duas contas: cookies, mensagens, filas, tickets, desconexão e capacidade separados.
- Arquivos criptografados não podem ser reutilizados por outro usuário.
- Gateway WebSocket rejeita tickets inválidos e origens diferentes; revogação fecha conexões.
- Teste Docker offline passou: dois Chromiums reais, cookies distintos, usuários Linux separados, encerramento independente e acesso negado ao armazenamento do supervisor; container sem rede externa.
- A validação real de leitura e envio na live continua pendente.

O envio continua experimental: usa o campo de chat da página configurada e confirma resposta POST /webcast/room/chat/ com status_code=0 e ID. Em resultado incerto, não reenvia automaticamente a mesma tentativa. Confirme a mensagem em outro navegador TikTok antes de repetir manualmente.

As sessões da implementação antiga de conta única (session.enc) não são usadas pelo novo gerenciador. Faça login novamente; o arquivo antigo não é apagado automaticamente.
