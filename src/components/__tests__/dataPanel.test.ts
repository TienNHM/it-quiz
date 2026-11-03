import {describe, expect, it} from 'vitest';
import {shopTablesOf} from '../Quiz/DataPanel';

const KNOWN = ['categories', 'customers', 'employees', 'order_items', 'orders', 'payments', 'products'];
const mk = (o: {id?: string; question?: string; code?: string; options?: string[]}) => ({id: 'sql-d01-01', question: 'x', options: ['a', 'b', 'c', 'd'], ...o});

describe('shopTablesOf', () => {
  it('lấy các bảng trong đoạn SQL theo thứ tự xuất hiện, không nhầm order_items với orders', () => {
    const code = 'SELECT count(*)\nFROM order_items AS oi\nJOIN products AS p ON p.product_id = oi.product_id\nWHERE oi.unit_price <> p.price;';
    expect(shopTablesOf(mk({code}), KNOWN)).toEqual(['order_items', 'products']);
  });
  it('nhận tên bảng có tiền tố schema shop.', () => {
    expect(shopTablesOf(mk({code: 'SELECT * FROM shop.orders'}), KNOWN)).toEqual(['orders']);
  });
  it('lấy cả bảng chỉ xuất hiện trong phương án (câu "truy vấn nào đúng")', () => {
    const options = ['```sql\nSELECT full_name FROM employees\n```', 'SELECT 1', 'SELECT 2', 'SELECT 3'];
    expect(shopTablesOf(mk({question: 'Liệt kê nhân viên. Truy vấn nào đúng?', options}), KNOWN)).toEqual(['employees']);
  });
  it('môn khác SQL thì không hiện dữ liệu', () => {
    expect(shopTablesOf(mk({id: 'cpp-c03-01', question: 'Mảng orders và products?', code: 'int orders[3];'}), KNOWN)).toEqual([]);
  });
});
