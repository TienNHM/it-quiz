import {describe, expect, it} from 'vitest';
import {shopTablesOf} from '../Quiz/DataPanel';

const KNOWN = ['categories', 'customers', 'employees', 'order_items', 'orders', 'payments', 'products'];

describe('shopTablesOf', () => {
  it('lấy các bảng trong đoạn SQL theo thứ tự xuất hiện, không nhầm order_items với orders', () => {
    const code = 'SELECT count(*)\nFROM order_items AS oi\nJOIN products AS p ON p.product_id = oi.product_id\nWHERE oi.unit_price <> p.price;';
    expect(shopTablesOf({question: 'Chạy truy vấn sau trên DSC Shop. Kết quả là bao nhiêu?', code, codeLang: 'sql'}, KNOWN)).toEqual(['order_items', 'products']);
  });
  it('nhận tên bảng có tiền tố schema shop.', () => {
    expect(shopTablesOf({question: 'x', code: 'SELECT * FROM shop.orders', codeLang: 'sql'}, KNOWN)).toEqual(['orders']);
  });
  it('câu không phải SQL thì không hiện dữ liệu', () => {
    expect(shopTablesOf({question: 'Mảng orders và products trong C++?', code: 'int orders[3];', codeLang: 'cpp'}, KNOWN)).toEqual([]);
  });
});
