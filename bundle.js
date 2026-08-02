#
firstName value
lastName
Expected display
Pass criteria
S1
<img src=x onerror=alert(1)>John
Smith
John Smith
No alert; "John Smith" shown
S2
<script>alert(document.cookie)</script>Bob
Roy
Bob Roy
No alert; "Bob Roy"
S3
<svg onload=alert(1)>Ana
Lee
Ana Lee
No alert; "Ana Lee"
S4
&#60;script&#62;alert(1)&#60;/script&#62;Kim
Das
Kim Das
No alert (tests HTML-entity encoded payload)
S5
javascript:alert(1)Lee
Roy
Lee Roy
No alert; "Lee Roy"
S6
Mary <img src=x onerror=
Jane
Mary Jane
No alert; "Mary Jane"
S7
<iframe src=//evil.com></iframe>Sue
Kim
Sue Kim
No iframe loads; "Sue Kim"
S8
<ScRiPt>alert(1)</ScRiPt>Tom
Fry
Tom Fry
No alert (mixed-case tag)
S9
"><img src=x onerror=alert(1)>
(blank)
(welcome area hidden)
No alert; no empty "Welcome," row
S10
<body onload=alert(1)>
(blank)
(welcome area hidden)
No alert

gyO'Brien
D'Angelo
O'Brien D'Angelo
N2
N'Golo
Kanté
N'Golo Kanté
N3
Åsa
Sjögren
Åsa Sjögren
N4
Øyvind
Bjørnstad
Øyvind Bjørnstad
N5
Þórunn
Guðmundsdóttir
Þórunn Guðmundsdóttir
N6
Väinö
Hämäläinen
Väinö Hämäläinen
N7
María José
García-Núñez
María José García-Núñez
N8
Íñigo
Ibáñez
Íñigo Ibáñez
N9
李
明
李 明
N10
山田
太郎
山田 太郎
N11
ジョン
スミス
ジョン スミス
N12
김민준
(blank)
김민준
N13
Olúwaṣẹ́gun
Adéṣínà
Olúwaṣẹ́gun Adéṣínà
N14
Chukwuemeka
Ọkeke
Chukwuemeka Ọkeke
N15
Ƙasimu
Ɗanjuma
Ƙasimu Ɗanjuma
N16
አበበ
በቀለ
አበበ በቀለ
N17
محمد
الأمين
محمد الأمين (renders right-to-left)
N18
Nguyễn Thị
Hương
Nguyễn Thị Hương
N19
Franz
Groß
Franz Groß
N20
J. R. R.
Tolkien
