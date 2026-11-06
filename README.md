# VPB · Agenda da turma

Protótipo interativo em português para Android, iPhone e navegador. Abre no calendário do mês atual com a agenda inicialmente vazia. Consulte o [PRD completo](./PRD.md).

## Abrir no celular

Use Node.js 24 LTS e Expo Go compatível com o SDK 57. No computador, execute:

```sh
git clone https://github.com/Parago07/VPB-APP.git
cd VPB-APP
npm ci
npm start
```

Conecte o celular à mesma rede Wi-Fi e abra o QR code exibido no terminal pelo Expo Go no Android ou pela câmera no iPhone. Para experimentar no navegador, execute `npm run web`.

## Experimentar o fluxo

1. Selecione um dia, toque em **Publicar rolé** e crie uma sugestão com dia e horário.
2. Em **Perfil → Trocar perfil de teste**, escolha Zé e reaja à sugestão. Volte ao autor, confirme o evento e depois altere a hora para conferir a diferença nas reações.
3. Dispare um **batsinal** com um local. Troque para outro perfil e abra **Avisos** para ver a simulação da entrega. Desative Batsinal nesse perfil e repita o teste.
4. Publique três rolés com o mesmo perfil. Em **Perfil**, equipe um chapéu e a Balthinha.
5. Como autor ou administrador, abra um evento e escolha **Cancelado pela patroa**. Verifique o rótulo na agenda e nos avisos dos outros perfis.

## Entrar na agenda compartilhada

No **Perfil**, cole seu código individual em **Convite privado da turma** e toque em **Conectar ao grupo**. O código identifica um dos 28 membros no projeto Supabase do VPB. O modo de teste do aparelho tem armazenamento separado. Seus dados de teste não são publicados ao conectar.

O servidor verifica o convite e as permissões em cada ação. Ele grava alterações com verificação de revisão e recibos para reenvios. O Supabase Realtime avisa os clientes quando buscar o estado atualizado. Preferências e avisos são filtrados por membro. Os avisos desta versão aparecem dentro do app.

Nos detalhes do evento, use **Quem leva o quê?** para assumir ou liberar itens. Em **Divisão de contas**, confirme sua presença, registre o que pagou e selecione quem divide igualmente. O registro de pagamento abate a dívida. **Adicionar ao Google Agenda** abre uma cópia editável com uma hora de duração inicial, no fuso de São Paulo.

O Quiz tradicional segue ao vivo. No Xadrez, a partida começa quando o segundo jogador entra; cada pessoa faz seu movimento quando puder. O ranking soma 1 ponto por vitória e 0,5 por empate. O Sudoku está pausado para uma futura classificação por tempo de resolução.

No Impostor, reúna pelo menos três membros. A cada rodada, apenas o próprio jogador vê seu papel. Cada membro envia uma pergunta anônima e recebe por sorteio uma pergunta de outra pessoa. Após todos responderem, os jogadores leem as respostas atribuídas a seus respondentes e votam em segredo. Cada acerto vale 1 ponto. Se ninguém acertar, o impostor recebe 1 ponto. O anfitrião pode iniciar outra rodada com o mesmo placar ou encerrar a sessão.

Os óculos são adaptações de duas armações do [DiceBear Pixel Art](https://www.dicebear.com/styles/pixel-art/), sob CC0 1.0. Os personagens de corpo inteiro e seus itens continuam sendo sprites locais do VPB.

### Alternativa de teste em LAN

Com Node 24, execute `npx expo export --platform web` e `npm run group` no computador. Em outro terminal PowerShell, defina `$env:VPB_PUBLIC_URL="http://IP-DO-PC:8787"` e execute `npm run invite -- "Kcaio"`. Abra o link individual no navegador do aparelho, na mesma rede privada, ou cole-o no campo de convite do app. O servidor armazena os dados em SQLite. Reemitir um convite substitui o anterior desse perfil.

### Administração Supabase

O banco privado é criado em `supabase/migrations`. A Edge Function `vpb-group` autentica o convite e executa as regras compartilhadas com o servidor LAN. Apenas o backend chama as funções SQL de leitura e gravação. O cliente usa a chave publicável. Guarde os códigos individuais fora do repositório; o banco guarda somente seus hashes SHA-256. Para substituir um convite, gere 32 bytes aleatórios, entregue sua representação hexadecimal ao membro e atualize o hash do código na tabela privada.

### Build para TestFlight

Para configurar a assinatura do VPB pela primeira vez, execute `npm run build:ios` e autentique-se na equipe Apple Developer. Use o cadastro do VPB (`com.parago07.vpbagenda`) no App Store Connect. Registre o Apple ID numérico desse app em `submit.production.ios.ascAppId` no `eas.json` e configure a chave de envio do projeto em `eas credentials -p ios`.

Para disparar pelo GitHub, configure um token Expo autorizado no secret `EXPO_TOKEN` do VPB-APP e abra **Actions → TestFlight → Run workflow → main**. O GitHub acompanha os dois jobs do Expo: compilação e envio ao TestFlight. No computador autenticado no Expo, o mesmo fluxo roda com `npx eas-cli@26.0.0 workflow:run .eas/workflows/testflight.yml --wait`.

```sh
npm test
npx expo export --platform all
```
