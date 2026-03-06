import styled from "@emotion/styled";

export const Input = styled.input`
  height: 2rem;
  padding: 0 1rem;
  background: white;
  border: none;
  border-radius: 4px;
  color: #583b25;
  outline: 2px solid transparent;
  transition: outline 0.2s ease-in-out;

  &:invalid {
    outline: 2px solid red;
  }
`;
