// import { useState } from "react";

// export function PriceUpdateForm() {
//   const [productId, setProductId] = useState("");
//   const [newTitle, setNewTitle] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");

//   const handleUpdateTitle = async () => {
//     setLoading(true);
//     setMessage("");

//     try {
//       const response = await fetch("/api/update-product-title", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           productId: `gid://shopify/Product/${productId}`,
//           newTitle,
//         }),
//       });

//       const result = await response.json();
//       if (result.success) {
//         setMessage("商品タイトルが正常に更新されました！");
//       } else {
//         setMessage("商品タイトルの更新に失敗しました。");
//         console.error(result.errors);
//       }
//     } catch (error) {
//       console.error("エラー:", error);
//       setMessage("エラー！！！");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div>
//       <h2>商品のタイトルを更新</h2>
//       <input
//         type="text"
//         placeholder="商品ID (数字部分のみ)"
//         value={productId}
//         onChange={(e) => setProductId(e.target.value)}
//       />
//       <input
//         type="text"
//         placeholder="新しい商品タイトル"
//         value={newTitle}
//         onChange={(e) => setNewTitle(e.target.value)}
//       />
//       <button onClick={handleUpdateTitle} disabled={loading}>
//         {loading ? "更新中..." : "タイトルを更新する"}
//       </button>
//       {message && <p>{message}</p>}
//     </div>
//   );
// }

import { useState } from "react";
import { Card, TextField, Button } from "@shopify/polaris";

export function PriceUpdateForm() {
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePrice = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/update-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, variantId, price }),
      });

      const result = await response.json();
      if (response.ok) {
        console.log(result.product);
        alert("価格が正常に更新されました！");
      } else {
        console.error(result.error);
        alert("エラーが発生！！！");
      }
    } catch (error) {
      console.error("リクエスト失敗:", error);
      alert("サーバー接続エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sectioned title="Change Product Price">
      <TextField
        label="Product ID"
        value={productId}
        onChange={setProductId}
        placeholder="gid://shopify/Product/123456789"
      />
      <TextField
        label="Variant ID"
        value={variantId}
        onChange={setVariantId}
        placeholder="gid://shopify/ProductVariant/1234567890"
      />
      <TextField
        label="New Price"
        value={price}
        onChange={setPrice}
        type="number"
        placeholder="12.34"
      />
      <Button onClick={handleUpdatePrice} primary loading={loading}>
        価格を更新する
      </Button>
    </Card>
  );
}
