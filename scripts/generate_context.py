#!/usr/bin/env python3
"""
Script: generate_context.py
UBICACIÓN: scripts/

¿QUÉ HACE ESTE SCRIPT?
- Consolida todo el código del proyecto en un único archivo (_all_code_context.txt).
- Respeta TODOS los archivos .gitignore encontrados en el proyecto (raíz, cdk/, etc.).
- Excluye archivos binarios automáticamente.
- Útil para pasarle contexto completo a otros LLMs.

USO:
  python3 scripts/generate_context.py
  # o
  npm run update:context
"""

import os
import subprocess
from pathlib import Path


def get_tracked_and_untracked_files(root_dir: Path) -> list[str]:
    """
    Usa `git ls-files` para obtener archivos rastreados por git,
    y combina con archivos no rastreados que no estén ignorados.
    Esto respeta TODOS los .gitignore automáticamente.
    """
    try:
        # Archivos rastreados por git
        tracked = subprocess.run(
            ["git", "ls-files"],
            cwd=root_dir,
            capture_output=True,
            text=True,
            check=True
        )
        tracked_files = set(tracked.stdout.strip().split('\n')) if tracked.stdout.strip() else set()

        # Archivos no rastreados pero NO ignorados (nuevos archivos que deberían incluirse)
        untracked = subprocess.run(
            ["git", "ls-files", "--others", "--exclude-standard"],
            cwd=root_dir,
            capture_output=True,
            text=True,
            check=True
        )
        untracked_files = set(untracked.stdout.strip().split('\n')) if untracked.stdout.strip() else set()

        # Combinar ambos conjuntos
        all_files = tracked_files | untracked_files
        
        # Filtrar entradas vacías
        return sorted([f for f in all_files if f])
    
    except subprocess.CalledProcessError as e:
        print(f"Error ejecutando git: {e}")
        print("Asegúrate de estar en un repositorio git.")
        return []
    except FileNotFoundError:
        print("Git no está instalado o no está en el PATH.")
        return []


def is_binary_file(file_path: Path) -> bool:
    """
    Detecta si un archivo es binario leyendo los primeros bytes.
    """
    try:
        with open(file_path, 'rb') as f:
            chunk = f.read(8192)
            # Si contiene bytes nulos, probablemente es binario
            if b'\x00' in chunk:
                return True
        return False
    except Exception:
        return True  # Si no podemos leerlo, lo tratamos como binario


def get_file_extension(file_path: str) -> str:
    """Obtiene la extensión del archivo en minúsculas."""
    return Path(file_path).suffix.lower()


# Extensiones de código/texto que sabemos que son seguras
TEXT_EXTENSIONS = {
    '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt', '.yaml', '.yml',
    '.html', '.css', '.scss', '.sass', '.less', '.py', '.sh', '.bash',
    '.env', '.gitignore', '.eslintrc', '.prettierrc', '.editorconfig',
    '.sql', '.graphql', '.xml', '.svg', '.toml', '.ini', '.cfg',
    '.dockerfile', '.makefile', '.lock', '.http'
}

# Extensiones que definitivamente son binarias
BINARY_EXTENSIONS = {
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.bmp', '.tiff',
    '.mp3', '.mp4', '.wav', '.avi', '.mov', '.mkv', '.webm',
    '.zip', '.tar', '.gz', '.rar', '.7z', '.bz2',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.exe', '.dll', '.so', '.dylib', '.bin', '.dat',
    '.woff', '.woff2', '.ttf', '.otf', '.eot',
    '.pyc', '.pyo', '.class', '.o', '.a'
}


def should_include_file(file_path: str, root_dir: Path) -> bool:
    """
    Determina si un archivo debe incluirse en el contexto.
    """
    full_path = root_dir / file_path
    
    # Excluir el archivo de salida
    if file_path == '_all_code_context.txt':
        return False
    
    # Excluir este mismo script
    if 'generate_context.py' in file_path:
        return False
    
    # Excluir package-lock.json (demasiado grande y sin valor para análisis)
    if file_path.endswith('package-lock.json'):
        return False
    
    # Verificar por extensión primero (más rápido)
    ext = get_file_extension(file_path)
    
    if ext in BINARY_EXTENSIONS:
        return False
    
    # Si es una extensión conocida de texto, incluir
    if ext in TEXT_EXTENSIONS or ext == '':
        # Archivos sin extensión pueden ser scripts, verificar si son binarios
        if ext == '' and is_binary_file(full_path):
            return False
        return True
    
    # Para extensiones desconocidas, verificar si es binario
    if is_binary_file(full_path):
        return False
    
    return True


def main():
    # El script está en scripts/, así que el root es un nivel arriba
    script_dir = Path(__file__).resolve().parent
    root_dir = script_dir.parent
    output_file = root_dir / "_all_code_context.txt"
    
    print(f"📂 Directorio raíz: {root_dir}")
    print(f"📄 Archivo de salida: {output_file}")
    print()
    
    # Obtener archivos usando git (respeta TODOS los .gitignore)
    all_files = get_tracked_and_untracked_files(root_dir)
    
    if not all_files:
        print("❌ No se encontraron archivos para procesar.")
        return
    
    print(f"🔍 Archivos encontrados por git: {len(all_files)}")
    
    # Filtrar archivos binarios y otros que no queremos
    files_to_include = []
    skipped_files = []
    
    for file_path in all_files:
        if should_include_file(file_path, root_dir):
            files_to_include.append(file_path)
        else:
            skipped_files.append(file_path)
    
    print(f"✅ Archivos a incluir: {len(files_to_include)}")
    print(f"⏭️  Archivos omitidos: {len(skipped_files)}")
    
    if skipped_files:
        print("\n📋 Archivos omitidos:")
        for f in skipped_files[:10]:  # Mostrar solo los primeros 10
            print(f"   - {f}")
        if len(skipped_files) > 10:
            print(f"   ... y {len(skipped_files) - 10} más")
    
    print()
    
    # Escribir el archivo de contexto
    with open(output_file, 'w', encoding='utf-8') as out:
        # Header informativo
        out.write("=" * 60 + "\n")
        out.write("CONTEXTO COMPLETO DEL PROYECTO\n")
        out.write("=" * 60 + "\n")
        out.write(f"Generado automáticamente por: scripts/generate_context.py\n")
        out.write(f"Total de archivos: {len(files_to_include)}\n")
        out.write("=" * 60 + "\n\n")
        
        # Índice de archivos
        out.write("ÍNDICE DE ARCHIVOS:\n")
        out.write("-" * 40 + "\n")
        for i, file_path in enumerate(files_to_include, 1):
            out.write(f"{i:3}. {file_path}\n")
        out.write("\n" + "=" * 60 + "\n\n")
        
        # Contenido de cada archivo
        for file_path in files_to_include:
            full_path = root_dir / file_path
            
            out.write("\n\n" + "=" * 50 + "\n")
            out.write(f"FILE: {file_path}\n")
            out.write("=" * 50 + "\n\n")
            
            try:
                with open(full_path, 'r', encoding='utf-8', errors='replace') as f:
                    content = f.read()
                    out.write(content)
                    # Asegurar que termine con newline
                    if content and not content.endswith('\n'):
                        out.write('\n')
            except Exception as e:
                out.write(f"[Error leyendo archivo: {e}]\n")
    
    print(f"✅ Archivo generado exitosamente: {output_file}")
    print(f"📊 Tamaño: {output_file.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
