import styled from "@emotion/styled";

export const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  grid-template-rows: 1fr auto;
  grid-template-areas:
    "top-left top-center top-right"
    "bottom-left bottom-center bottom-right";
  min-height: 100vh;
  margin: 0;
  padding: 0;
`;

export const LeftPanel = styled.div`
  grid-area: top-left;
  padding: 1rem;
`;

export const MiddlePanel = styled.div`
  grid-area: top-center;
  padding: 1rem;
`;

export const RightPanel = styled.div`
  grid-area: top-right;
  padding: 1rem;
`;

export const BottomLeftPanel = styled.div`
  grid-area: bottom-left;
  padding: 1rem;
`;

export const BottomCenterPanel = styled.div`
  grid-area: bottom-center;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const BottomRightPanel = styled.div`
  grid-area: bottom-right;
  padding: 1rem;
`;
