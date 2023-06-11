const express = require('express');
const app = express();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const fs = require('fs');

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

let products = [
  { id: 1, title: '갈색 실눈 햄토리', price: 9.99, category: '갈색', image: "item1.png" },
  { id: 2, title: '검은색 큰눈 뚱토리', price: 7.99, category: '검은색', image: "item2.png" },
  { id: 3, title: '주황색 실눈 햄토리', price: 10.99, category: '주황색', image: "item3.png" },
  { id: 4, title: '흰색 큰눈 햄토리', price: 6.99, category: '흰색', image: "item4.png" },
  { id: 5, title: '주황색 큰눈 햄토리', price: 15.99, category: '주황색', image: "item5.png" },
  { id: 6, title: '회색 졸린눈 뚱토리', price: 3.99, category: '회색', image: "item6.png" },
  { id: 7, title: '노랑색 큰눈 뚱토리', price: 5.99, category: '노랑색', image: "item7.png" },
  { id: 8, title: '회색 큰눈 햄토리', price: 12.99, category: '회색', image: "item8.png" }
];

// 리뷰 작성 및 저장 기능 추가
app.post('/product/:productId/review', (req, res) => {
  const productId = parseInt(req.params.productId);
  const { author, content } = req.body;

  const product = products.find(product => product.id === productId);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
  } else {
    const review = { author, content };

    // 리뷰를 해당 상품의 리뷰 목록에 추가
    if (!product.reviews) {
      product.reviews = [];
    }
    product.reviews.push(review);

    // 리뷰를 comment.json 파일에 저장
    const filePath = path.join(__dirname, 'comment.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
      } else {
        let comments = [];
        if (data) {
          comments = JSON.parse(data);
        }
        comments.push({ productId, review });

        fs.writeFile(filePath, JSON.stringify(comments), 'utf8', (err) => {
          if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
          } else {
            res.status(200).json({ message: 'Review saved successfully' });
          }
        });
      }
    });
  }
});

// 리뷰 작성 버튼 생성
app.get('/product/:productId', (req, res) => {
  const productId = parseInt(req.params.productId);
  const product = products.find(product => product.id === productId);
  if (!product) {
    res.status(404).send('Product not found');
  } else {
    const reviews = product.reviews || [];
    res.send(`
      <h1>${product.title}</h1>
      <p><img src="item1.png" alt="asdf"></p>
      <p>product_id: ${product.id}</p>
      <p>product image: <img src="${product.image}" alt="${product.title}" style="width: 200px;"></p>
      <p>product Price: $${product.price}</p>
      <p>product Category: ${product.category}</p>
      <button onclick="openReviewModal(${productId})">리뷰 작성</button>

      <h2>Reviews</h2>
      <div id="reviewList">
        ${reviews.map(review => `<div><strong>${review.author}</strong>: ${review.content}</div>`).join('')}
      </div>

      <script>
        function openReviewModal(productId) {
          const modal = document.createElement('div');
          modal.style.position = 'fixed';
          modal.style.top = '0';
          modal.style.left = '0';
          modal.style.width = '100%';
          modal.style.height = '100%';
          modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          modal.style.display = 'flex';
          modal.style.alignItems = 'center';
          modal.style.justifyContent = 'center';
          
          const form = document.createElement('form');
          form.addEventListener('submit', submitReview);
          
          const authorInput = document.createElement('input');
          authorInput.type = 'text';
          authorInput.placeholder = '이름';
          form.appendChild(authorInput);
          
          const contentInput = document.createElement('textarea');
          contentInput.placeholder = '리뷰';
          form.appendChild(contentInput);
          
          const submitButton = document.createElement('button');
          submitButton.type = 'submit';
          submitButton.textContent = '제출';
          form.appendChild(submitButton);
          
          modal.appendChild(form);
          
          document.body.appendChild(modal);
          
          function submitReview(event) {
            event.preventDefault();
            
            const author = authorInput.value;
            const content = contentInput.value;
            
            const data = {
              author,
              content
            };
            
            fetch('/product/' + productId + '/review', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(data)
            })
              .then(response => response.json())
              .then(result => {
                alert(result.message);
                modal.remove();
              })
              .catch(error => {
                console.error(error);
                alert('Error submitting review');
              });
          }
        }
      </script>
    `);
  }
});

// 제품 페이지 redirection
app.get('/product/:productId', (req, res) => {
  const productId = parseInt(req.params.productId);
  const product = products.find(product => product.id === productId);
  if (!product) {
    res.status(404).send('Product not found');
  } else {
    res.redirect(`/product/${productId}/details`); // 상품 상세정보로 리다이렉트
  }
});

//제품 상세정보 조회ㅜㅐ
app.get('/product/:productId/details', (req, res) => {
  const productId = parseInt(req.params.productId);
  const product = products.find(product => product.id === productId);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
  } else {
    res.json({
      product_id: product.id,
      product_image: product.image,
      product_title: product.title,
      product_price: product.price,
      product_category: product.category
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/product', (req, res) => {
  const db = new sqlite3.Database('product.db');
  db.serialize(() => {
    db.all('SELECT * FROM product', (err, rows) => {
      if (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
      } else {
        res.json(rows);

      }
    });
  });
  db.close();
});

app.listen(3000, () => {
  console.log('서버가 http://localhost:3000에서 실행 중입니다.');
});