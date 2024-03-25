import React from 'react';
import { Card, CardHeader, CardBody, Image } from '@nextui-org/react';

export default function Navigation() {
  return (
    <Card>
      <CardHeader>
        <p>stat name</p>
        <small>stat value</small>
      </CardHeader>
      <CardBody>chart</CardBody>
    </Card>
  );
}
