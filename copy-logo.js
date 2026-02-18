const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const publicDir = path.join(projectRoot, 'public');
const dest = path.join(publicDir, 'logo-app.png');

const origins = [
  path.join(process.env.USERPROFILE || '', '.cursor', 'projects', 'c-Users-eduka-Downloads-App-Gest-o-Igreja', 'assets', 'c__Users_eduka_AppData_Roaming_Cursor_User_workspaceStorage_905592b869c22d904283c935760e81a5_images_Design_sem_nome__3_-removebg-preview-32b3e302-c421-4a0d-8555-001aef8c7449.png'),
  path.join(process.env.USERPROFILE || '', '.cursor', 'projects', 'c-Users-eduka-Downloads-App-Gest-o-Igreja', 'assets', 'c__Users_eduka_AppData_Roaming_Cursor_User_workspaceStorage_905592b869c22d904283c935760e81a5_images_Design_sem_nome__3_-removebg-preview-f9eced14-1a13-4225-8428-ea066f37681f.png'),
];

let copied = false;
for (const src of origins) {
  if (fs.existsSync(src)) {
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.copyFileSync(src, dest);
    console.log('Logo copiada para public/logo-app.png');
    copied = true;
    break;
  }
}
if (!copied) {
  console.log('Nenhuma logo encontrada em .cursor/projects/.../assets/.');
  console.log('Copie manualmente a imagem da logo para: public/logo-app.png');
}
