# VPB · Agenda da turma

Protótipo interativo em português para Android, iPhone e navegador. Abre no calendário do mês atual com três rolês de exemplo. Consulte o [PRD completo](./PRD.md).

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

1. Selecione um dia, toque em **Publicar rolê** e crie uma sugestão com dia e horário.
2. Em **Perfil → Trocar perfil de teste**, escolha Zé e reaja à sugestão. Volte ao autor, confirme o evento e depois altere a hora para conferir a diferença nas reações.
3. Dispare um **batsinal** com um local. Troque para outro perfil e abra **Avisos** para ver a simulação da entrega. Desative Batsinal nesse perfil e repita o teste.
4. Publique três rolês com o mesmo perfil. Em **Perfil**, equipe um chapéu e a Balthinha.
5. Como autor ou administrador, abra um evento e escolha **Cancelado pela patroa**. Verifique o rótulo na agenda e nos avisos dos outros perfis.

## Dados e alcance desta versão

O calendário, avatares, reações e preferências persistem no armazenamento local. Cada instalação tem sua própria cópia. O seletor de perfis permite experimentar permissões e avisos no mesmo aparelho. Os três eventos de exemplo contam para a progressão dos respectivos autores.

Para colocar o grupo em uso real, faltam autenticação por convite, armazenamento compartilhado, validação de permissões no servidor e entrega de push. O protótipo simula avisos dentro do app. O teste com tela bloqueada requer credenciais e aparelhos físicos. [Configuração de push no Expo](https://docs.expo.dev/push-notifications/push-notifications-setup/)

## Verificação

```sh
npm test
npx expo export --platform all
```
