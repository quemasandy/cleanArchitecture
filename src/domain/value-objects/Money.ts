/**
 * Archivo: Money.ts
 * UBICACIÓN: Capa de Dominio / Value Objects
 *
 * - Para quién trabaja: Entidades y Servicios de Dominio.
 * - Intención: Manejar operaciones monetarias de forma segura.
 * - Misión: Prevenir errores de redondeo y divisa en cálculos financieros.
 */
export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string = 'USD'
  ) {
    if (amount < 0) {
      throw new Error("El monto no puede ser negativo.");
    }
    // Validación simple de moneda
    if (currency.length !== 3) {
      throw new Error("La moneda debe tener 3 caracteres (ISO 4217).");
    }
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error("No se pueden sumar monedas diferentes.");
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  toString(): string {
    return `${this.amount.toFixed(2)} ${this.currency}`;
  }
}
