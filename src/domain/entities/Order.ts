/**
 * Archivo: Order.ts
 * UBICACIÓN: Capa de Dominio / Entidades
 *
 * ¿QUÉ ES UN AGGREGATE ROOT?
 * - Es la entidad principal que protege un grupo de objetos relacionados.
 * - Toda modificación al grupo DEBE pasar por el aggregate root.
 * - Garantiza que las INVARIANTES (reglas que siempre deben cumplirse)
 *   nunca se violen.
 *
 * MODELO DE INMUTABILIDAD:
 * Esta entidad usa un estilo COMPLETAMENTE INMUTABLE:
 * - Cada operación que modifica estado retorna una NUEVA instancia.
 * - La instancia original nunca cambia.
 * - Esto hace el código más predecible y facilita el testing.
 *
 * ¿POR QUÉ INMUTABLE Y NO MUTABLE?
 * Ambos enfoques son válidos. Lo importante es la CONSISTENCIA del modelo.
 * Si markAsPaid() retorna nueva instancia, addItem() también debe hacerlo.
 * Mezclar estilos crea confusión: "¿este método muta o no?"
 *
 * - Para quién trabaja: La lógica de negocio (Dominio) y los Use Cases.
 * - Intención: Representar una orden de compra como aggregate root.
 * - Misión: Gestionar los items, costos y el estado de una transacción,
 *   protegiendo las invariantes del negocio.
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
  /**
   * El constructor ahora recibe los items como parámetro para soportar
   * el estilo inmutable: cada operación crea una nueva instancia con
   * los items correctos, en vez de mutar un array interno.
   *
   * El parámetro items tiene un default de [] para que crear una orden
   * nueva (vacía) siga siendo sencillo: new Order(id, userId).
   */
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly status: 'PENDING' | 'PAID' | 'FAILED' = 'PENDING',
    public readonly createdAt: Date = new Date(),
    private readonly _items: ReadonlyArray<OrderItem> = []
  ) {}

  /**
   * REGLA DE NEGOCIO (Aggregate Invariant):
   * Agregar un item a la orden.
   *
   * ANTES (mutable):   order.addItem(...) → void (mutaba _items internamente)
   * AHORA (inmutable):  order = order.addItem(...) → Order (retorna nueva instancia)
   *
   * ¿POR QUÉ RETORNA UNA NUEVA ORDER?
   * Porque si markAsPaid() retorna nueva instancia, addItem() debe hacer lo mismo.
   * La consistencia del modelo es más importante que seguir una moda.
   */
  addItem(productId: string, price: Money, quantity: number): Order {
    // REGLA DE NEGOCIO: solo se pueden agregar items a órdenes pendientes
    if (this.status !== 'PENDING') {
      throw new Error("No se pueden agregar items a una orden cerrada.");
    }

    const newItem = new OrderItem(productId, price, quantity);
    // Retornamos nueva instancia con los items existentes + el nuevo
    return new Order(this.id, this.userId, this.status, this.createdAt, [...this._items, newItem]);
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
   * Retorna nueva instancia con status 'PAID' (inmutabilidad).
   */
  markAsPaid(): Order {
    if (this.status === 'PAID') {
      throw new Error("La orden ya está pagada.");
    }
    return new Order(this.id, this.userId, 'PAID', this.createdAt, [...this._items]);
  }

  /**
   * REGLA DE NEGOCIO:
   * Marcar la orden como fallida.
   * Retorna nueva instancia con status 'FAILED' (inmutabilidad).
   */
  markAsFailed(): Order {
    return new Order(this.id, this.userId, 'FAILED', this.createdAt, [...this._items]);
  }
}
