/**
 * Archivo: Order.ts
 * UBICACIÓN: Capa de Dominio / Entidades
 *
 * Representa una orden de compra en el sistema.
 * AHORA ES UN AGGREGATE ROOT (Raíz de Agregado).
 *
 * - Para quién trabaja: La lógica de negocio (Dominio).
 * - Intención: Representar una orden de compra.
 * - Misión: Gestionar los items, costos y el estado de una transacción.
 */

import { Money } from '../value-objects/Money';

// Value Object interno del Agregado
export class OrderItem {
  constructor(
    public readonly productId: string,
    public readonly price: Money, // VO!
    public readonly quantity: number
  ) {
    if (quantity <= 0) throw new Error("La cantidad debe ser mayor a 0.");
    // El precio negativo se valida dentro del VO Money, pero aquí validamos cantidad.
  }

  get total(): Money {
    return this.price.multiply(this.quantity);
  }
}

export class Order {
  private _items: OrderItem[] = [];

  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly status: 'PENDING' | 'PAID' | 'FAILED' = 'PENDING',
    public readonly createdAt: Date = new Date()
  ) {}

  /**
   * REGLA DE NEGOCIO (Aggregate Invariant):
   * Agregar un item a la orden.
   */
  addItem(productId: string, price: Money, quantity: number): void {
    if (this.status !== 'PENDING') {
      throw new Error("No se pueden agregar items a una orden cerrada.");
    }
    this._items.push(new OrderItem(productId, price, quantity));
  }

  /**
   * Propiedad calculada: El total de la orden es la suma de sus items.
   */
  get totalAmount(): Money {
    // Si no hay items, retornamos 0 USD por defecto.
    if (this._items.length === 0) {
      return new Money(0, 'USD'); 
    }
    
    // Asumimos que todos los items tienen la misma moneda para este ejemplo simple.
    // Una implementación real manejaría conversión de monedas o validaría que todos sean la misma.
    const currency = this._items[0].price.currency;
    const initial = new Money(0, currency);

    return this._items.reduce((sum, item) => sum.add(item.total), initial);
  }

  get items(): ReadonlyArray<OrderItem> {
    return this._items;
  }

  /**
   * REGLA DE NEGOCIO:
   * Marcar la orden como pagada.
   */
  markAsPaid(): Order {
    if (this.status === 'PAID') {
      throw new Error("La orden ya está pagada.");
    }
    // En un enfoque inmutable puro devolveríamos una nueva instancia con los mismos items
    // Para simplificar este ejemplo, mutamos el estado interno o recreamos copiando items
    const paidOrder = new Order(this.id, this.userId, 'PAID', this.createdAt);
    paidOrder._items = [...this._items]; // Copiamos los items
    return paidOrder;
  }

  /**
   * REGLA DE NEGOCIO:
   * Marcar la orden como fallida.
   */
  markAsFailed(): Order {
    const failedOrder = new Order(this.id, this.userId, 'FAILED', this.createdAt);
    failedOrder._items = [...this._items];
    return failedOrder;
  }
}
