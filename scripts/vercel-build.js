const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando configuración de Prisma para Vercel...');

try {
  // Limpiar generaciones anteriores
  const generatedPath = path.join(__dirname, '../src/generated/prisma');
  if (fs.existsSync(generatedPath)) {
    console.log('🧹 Limpiando generaciones anteriores...');
    fs.rmSync(generatedPath, { recursive: true, force: true });
  }
  
  // Generar cliente de Prisma
  console.log('📦 Generando cliente de Prisma...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Verificar que el cliente fue generado
  const clientPath = path.join(__dirname, '../src/generated/prisma');
  if (fs.existsSync(clientPath)) {
    console.log('✅ Cliente de Prisma generado exitosamente en:', clientPath);
    
    // Listar archivos generados
    const files = fs.readdirSync(clientPath);
    console.log('📁 Archivos generados:', files);
    
    // Verificar el engine binario
    const engineFiles = files.filter(f => f.includes('query_engine'));
    if (engineFiles.length > 0) {
      console.log('✅ Query Engine encontrado:', engineFiles);
      
      // Crear copias del engine en ubicaciones adicionales
      const engineFileName = 'libquery_engine-rhel-openssl-3.0.x.so.node';
      const sourcePath = path.join(clientPath, engineFileName);
      
      if (fs.existsSync(sourcePath)) {
        // Copiar a la raíz del proyecto
        const rootPath = path.join(__dirname, '..');
        const rootEnginePath = path.join(rootPath, engineFileName);
        fs.copyFileSync(sourcePath, rootEnginePath);
        console.log('📋 Engine copiado a:', rootEnginePath);
        
        // Asegurar que el directorio .prisma/client existe
        const prismaClientPath = path.join(rootPath, '.prisma', 'client');
        if (!fs.existsSync(prismaClientPath)) {
          fs.mkdirSync(prismaClientPath, { recursive: true });
        }
        const prismaClientEnginePath = path.join(prismaClientPath, engineFileName);
        fs.copyFileSync(sourcePath, prismaClientEnginePath);
        console.log('📋 Engine copiado a:', prismaClientEnginePath);
      }
    } else {
      console.log('⚠️ Query Engine no encontrado, Vercel lo manejará');
    }
  } else {
    console.error('❌ No se pudo generar el cliente de Prisma');
    process.exit(1);
  }
  
  // Ejecutar build de Next.js
  console.log('🚀 Iniciando build de Next.js...');
  execSync('next build', { stdio: 'inherit' });
  
  console.log('✨ Build completado exitosamente');
} catch (error) {
  console.error('❌ Error durante el build:', error.message);
  process.exit(1);
}
