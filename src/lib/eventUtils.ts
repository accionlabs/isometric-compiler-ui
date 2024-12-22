// @/lib/eventUtils.ts

import React from 'react';

export const handleWithStopPropagation = <T extends React.MouseEvent>(
  event: T,
  handler: () => void
) => {
  event.stopPropagation();
  handler();
};