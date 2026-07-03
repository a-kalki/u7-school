# CSS Center Align

* * *

## CSS Centering Elements

With CSS, you can center elements (horizontally, vertically, or both) with several methods, depending on the type of element.

I am vertically and horizontally centered.

```javascript
.center {  display: flex;  justify-content: center;  align-items: center;}
```

* * *

* * *

## Horizontal Alignment

There are several ways to horizontally align elements:

*   **margin: auto** - Center block elements
*   **text-align: center** - Center text inside elements
*   **float** or **position** - Left/right alignment

* * *

## Vertical Alignment

Vertical centering can be achieved using modern layout techniques:

*   **Flexbox** - Use `align-items: center`
*   **Grid** - Use `place-items: center`
*   **Position + Transform** - For elements of unknown dimensions

**Tip:** Flexbox is the most modern and recommended method for centering content both horizontally and vertically!