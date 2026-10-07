label.checkbox-inline[for="noCompanyName"] {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transform: none;
  pointer-events: auto;
}
label.checkbox-inline[for="noCompanyName"] input {
  position: static;
  flex: none;
  width: auto;
  height: auto;
  margin: 0;
}
#companyName ~ label[id^="error-msg-companyName"] {
  position: static;
}
#companyName:disabled,
#companyName[readonly] {
  background: #f2f2f2;
  color: #8c8c8c;
  cursor: not-allowed;
}
#companyName:disabled + label,
#companyName[readonly] + label {
  color: #8c8c8c;
}
