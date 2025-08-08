const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting Prisma configuration for Vercel...');
console.log('📍 Current directory:', process.cwd());
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔗 Database URL present:', !!process.env.BBDD_DATABASE_URL || !!process.env.DATABASE_URL);

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  // Verify client was generated
  const clientPath = path.join(process.cwd(), 'src/generated/prisma');
  console.log('🔍 Checking for generated client at:', clientPath);
  
  if (fs.existsSync(clientPath)) {
    console.log('✅ Prisma client generated successfully');
    const files = fs.readdirSync(clientPath);
    console.log(`📁 Generated ${files.length} files`);
    
    // Check for query engine
    const engineFiles = files.filter(f => f.includes('query_engine'));
    if (engineFiles.length > 0) {
      console.log('✅ Query Engine files found:', engineFiles.join(', '));
    } else {
      console.log('⚠️ No Query Engine files found in generated output');
    }
  } else {
    console.error('❌ Prisma client directory not found after generation');
    process.exit(1);
  }
  
  // Build Next.js
  console.log('🚀 Starting Next.js build...');
  execSync('next build', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  console.log('✨ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  if (error.stack) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
}
