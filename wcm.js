/* Scope: request-a-quote dynamic form */
.raq-form__enhanced-sf .dynamic-form {
  --err: #c8102e;
  --err-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect x='3' y='3' width='10' height='10' rx='1.5' transform='rotate(45 8 8)' fill='%23c8102e'/%3E%3Crect x='7.25' y='4.5' width='1.5' height='4.5' fill='%23fff'/%3E%3Crect x='7.25' y='10' width='1.5' height='1.5' fill='%23fff'/%3E%3C/svg%3E");
}

/* 1. Error text: drop the triangle, red small text */
.raq-form__enhanced-sf .dynamic-form label.error {
  color: var(--err);
  font-size: 13px;
  font-weight: 400;
  margin-top: 6px;
  padding-left: 0;
  background: none;
}
.raq-form__enhanced-sf .dynamic-form label.error::before,
.raq-form__enhanced-sf .dynamic-form label.error > i,
.raq-form__enhanced-sf .dynamic-form label.error > svg,
.raq-form__enhanced-sf .dynamic-form label.error > img,
.raq-form__enhanced-sf .dynamic-form label.error > span[class*="icon"] {
  display: none !important;
}

/* 2. Invalid input/textarea: red border + diamond icon on the right */
.raq-form__enhanced-sf .dynamic-form
  .col-xs-12:has(> label.error[style*="block"]) :is(input, textarea) {
  border: 2px solid var(--err);
  background-image: var(--err-icon);
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-size: 18px;
  padding-right: 44px;
}

/* 3. Select: icon sits left of the chevron (keeps existing chevron bg) */
.raq-form__enhanced-sf .dynamic-form
  .col-xs-12:has(> label.error[style*="block"]) select {
  border: 2px solid var(--err);
  background-image: var(--err-icon), var(--select-chevron, none);
  background-repeat: no-repeat, no-repeat;
  background-position: right 40px center, right 14px center;
  background-size: 18px, 12px;
  padding-right: 68px;
}

/* 4. Focus state when invalid */
.raq-form__enhanced-sf .dynamic-form
  .col-xs-12:has(> label.error[style*="block"]) :is(input, select, textarea):focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(200, 16, 46, .2);
}
