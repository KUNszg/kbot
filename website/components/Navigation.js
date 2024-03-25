import React from 'react';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Image,
} from '@nextui-org/react';

export default function Navigation() {
  return (
    <Navbar>
      <NavbarBrand id={'navbar-brand'}>
        <div id={'stats'}>
          <NavbarContent className={'stats-list'}>
            <NavbarItem className={'stats-item'}>Module status 1</NavbarItem>
            <NavbarItem className={'stats-item'}>Module status 2 ...</NavbarItem>
          </NavbarContent>
        </div>

        <div id={'logo-png'}>
          <Image className={'logo'} src={'./favicon.png'} alt={'logo'} height={100}></Image>
        </div>
        <NavbarContent
          id={'navbar-content'}
          className={'hidden sm:flex gap-4 navbar-item-list'}
        >
          <NavbarItem className={'navbar-item'}>
            <Link color={'foreground'} href={'#'}>
              Commands
            </Link>
          </NavbarItem>
          <NavbarItem isActive className={'navbar-item'}>
            <Link href={'#'} aria-current={'page'} color={'secondary'}>
              Emote-checker
            </Link>
          </NavbarItem>
          <NavbarItem className={'navbar-item'}>
            <Link color={'foreground'} href={'#'}>
              Integrations
            </Link>
          </NavbarItem>
          <NavbarItem className={'navbar-item'}>
            <Link color={'foreground'} href={'#'}>
              API
            </Link>
          </NavbarItem>
          <NavbarItem className={'navbar-item'}>
            <Link color={'foreground'} href={'#'}>
              Other projects
            </Link>
          </NavbarItem>
        </NavbarContent>
      </NavbarBrand>
    </Navbar>
  );
}
// todo: login / logout / user profile
