#!/usr/bin/env node
/**
 * Archivo: cdk-app.ts
 * UBICACIÓN: Entry Point de la Infraestructura
 * 
 * Este archivo es el "main.ts" pero del mundo de la Infraestructura.
 * Su único trabajo es inicializar la aplicación CDK y crear las pilas (Stacks).
 */

// Import para soportar sourcemaps (ayuda a ver errores typescript originales)
import 'source-map-support/register';
// Importamos el núcleo de CDK
import * as cdk from 'aws-cdk-lib';
// Importamos NUESTRA definición del Stack (el plano que creamos en lib/)
import { CleanArchStack } from '../lib/clean-arch-stack';

// 1. Inicializamos la Aplicación CDK
// Una "App" es el contenedor raíz de todos los Stacks.
const app = new cdk.App();

// 2. Instanciamos nuestro Stack
// Esto le dice a CDK: "Dentro de esta App, quiero que exista este Stack".
new CleanArchStack(app, 'CleanArchStack', {
  /* 
   * Configuración del Entorno (Environment):
   * Define en qué cuenta y región de AWS se desplegará esto.
   */

  /* Opción A: Agnóstico (Por defecto)
   * Si no especificamos 'env', el stack se compila de forma genérica.
   * Se desplegará en la cuenta/región que tengas configurada en tu CLI al momento de ejecutar 'deploy'.
   * Es útil para templates reutilizables.
   */
  
  /* Opción B: Heredar de CLI (Recomendado para desarrollo personal)
   * Toma la cuenta y región explícitas de tu configuración actual de 'aws configure'.
   */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Opción C: Hardcoded (Para producción estricta)
   * Fija el stack a una cuenta específica para evitar accidentes (ej. desplegar prod en dev).
   */
  // env: { account: '123456789012', region: 'us-east-1' },
});

// Cuando corres 'cdk synth', este archivo se ejecuta, la App se inicializa,
// el Stack se registra, y CDK genera la plantilla de CloudFormation resultante.
