// Script simples para gerar ícones de placeholder em dataURI
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';

// Obtém o diretório atual (equivalente a __dirname no CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVG de base com cor verde e texto R$
const baseSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="SIZE" height="SIZE" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="24" fill="#4CAF50"/>
  <text x="64" y="80" font-size="80" text-anchor="middle" fill="white" font-family="Arial, sans-serif">R$</text>
</svg>
`;

// Tamanhos de ícones
const sizes = [16, 48, 128];

// Diretório de destino para arquivos temporários
const destDir = path.join(__dirname, 'dist', 'icons');

// Diretório para ícones a serem incluídos no build
const publicIconsDir = path.join(__dirname, 'public', 'icons');

// Criar SVGs para cada tamanho
for (const size of sizes) {
  const svg = baseSvg.replace(/SIZE/g, size.toString());
  const svgBase64 = Buffer.from(svg).toString('base64');
  const dataUri = `data:image/svg+xml;base64,${svgBase64}`;
  
  // Vamos criar apenas um arquivo de texto com o dataURI
  // O usuário poderá copiar e converter manualmente se necessário
  fs.writeFileSync(
    path.join(destDir, `icon${size}.txt`), 
    `Este é um ícone placeholder em base64 para o tamanho ${size}x${size}.\n` +
    `Copie o dataURI abaixo para um conversor online ou abra em um navegador:\n\n` +
    dataUri
  );
  
  // Criar um HTML que mostra o ícone
  fs.writeFileSync(
    path.join(destDir, `icon${size}.html`),
    `<!DOCTYPE html>
<html>
<head>
  <title>Ícone ${size}x${size}</title>
</head>
<body style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f0f0;">
  <div>
    <img src="${dataUri}" width="${size}" height="${size}" style="display: block; margin: 0 auto;">
    <p style="text-align: center; margin-top: 20px;">Ícone ${size}x${size}</p>
    <p style="text-align: center; margin-top: 10px;">Para salvar: clique com o botão direito na imagem e escolha "Salvar imagem como..."</p>
  </div>
</body>
</html>`
  );
  
  console.log(`Arquivo de ícone ${size}x${size} criado em ${path.join(destDir, `icon${size}.html`)}`);
}

// Criar ícones para o Chrome usando uma solução alternativa
// Esta abordagem usa dataURLs diretamente no manifest.json
console.log('\nCriando arquivo de ícones para manifest.json...');

// Também vamos criar uma versão simplificada dos ícones em PNG base64 inline
const pngPlaceholder = {
  16: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAUklEQVQ4T2NkYGD4z0ABYKRAHM6A/wz/UcWZmZgZ1q1bx8DCwgKnQQYwMzODZdANgBmCTxNOA0AScANgJhJjCsVeGPVCQmE4GgYUxgHFYUB2UgIA+W8fEbgHiB4AAAAASUVORK5CYII=',
  48: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAApElEQVRoQ+2YwQ6AIAxD6f9/tIkhRphb6YuJHDy5Qdd2BYaA+AmE9wcCBeRyOQERSTlrrX2OKOVsZnY9K93+3t/C3YDsNtp4NAyoq+e8bU8gIupFNt2yBdwPO3M3oWmk2QIVojMNBBBAAAEEEEAAAQQQQAABBBCICTi3UGzh3SV3aDq6YysDzLnELvuQu6lLzJepE2jvDmRfZTv5aR5y9v8AX+EwIK5XyN8AAAAASUVORK5CYII=',
  128: 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAArElEQVR42u3dsQ0AIAwDwYT9d34MkhECHWaA7rO32m5nGdj7GV3/qlX9GwAABAAgAAACACAAAAEACABAAAACACAAAAEACABAAAACACAAAAEAvNmaxcMNUP0sMiAAAhTfQgQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQ4Pcl3AI8ewGrHuDZJpT+D1j9CQAABAAgAAACACAAAAEACABAAAACALjYAP3NBQGnS0kHAAAAAElFTkSuQmCC'
};

// Vamos também salvar estas versões PNG como arquivos
for (const size in pngPlaceholder) {
  // Salvar no diretório public/icons
  fs.writeFileSync(
    path.join(publicIconsDir, `icon${size}.png`),
    Buffer.from(pngPlaceholder[size], 'base64')
  );
  console.log(`Arquivo PNG ${size}x${size} criado em ${path.join(publicIconsDir, `icon${size}.png`)}`);
  
  // Verificar tamanho do arquivo criado
  const stats = fs.statSync(path.join(publicIconsDir, `icon${size}.png`));
  console.log(`Tamanho do arquivo: ${stats.size} bytes`);
}

console.log('\nPronto! Os ícones foram gerados.');
console.log('Você pode abrir os arquivos HTML para visualizar e salvar os ícones.'); 
