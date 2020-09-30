import { Divider, Drawer, ListItem } from '@material-ui/core'
import AppBar from '@material-ui/core/AppBar'
import IconButton from '@material-ui/core/IconButton'
import { makeStyles, Theme } from '@material-ui/core/styles'
import Toolbar from '@material-ui/core/Toolbar'
import CloseIcon from '@material-ui/icons/Close'
import MenuIcon from '@material-ui/icons/Menu'
import React, { FunctionComponent, useState } from 'react'
import {
  TransactionHistoryMenuIconButton,
  WalletConnectionIndicator,
  WalletConnectionStatusButton,
} from '../buttons/Buttons'
import { RenBridgeLogoIcon } from '../icons/RenIcons'

const useStyles = makeStyles((theme: Theme) => ({
  grow: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  logo: {
    display: "flex",
    alignItems: "center",
  },
  desktopMenu: {
    display: "none",
    [theme.breakpoints.up("sm")]: {
      display: "flex",
    },
  },
  desktopTxHistory: {
    marginRight: 20,
  },
  mobileMenu: {
    display: "flex",
    [theme.breakpoints.up("sm")]: {
      display: "none",
    },
  },
  drawerLogo: {
    fontSize: 20,
  },
  drawerPaper: {
    minWidth: 300,
  },
  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  drawerClose: {
    cursor: "pointer",
    fontSize: 26,
  },
  drawerListItem: {
    padding: `16px 0`,
  },
  drawerListItemIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 40,
    marginRight: 16,
  },
}));

export const MainLayout: FunctionComponent = ({ children }) => {
  const styles = useStyles();
  const [isDrawerOpened, setIsMobileDrawerOpened] = useState(true);

  const handleDrawerClose = () => {
    setIsMobileDrawerOpened(false);
  };

  const handleDrawerOpen = () => {
    setIsMobileDrawerOpened(true);
  };

  const drawerId = "main-menu-mobile";
  const renderDrawer = (
    <Drawer
      anchor="right"
      id={drawerId}
      keepMounted
      open={isDrawerOpened}
      onClose={handleDrawerClose}
      PaperProps={{ className: styles.drawerPaper }}
    >
      <div className={styles.drawerHeader}>
        <RenBridgeLogoIcon className={styles.drawerLogo} />
        <CloseIcon className={styles.drawerClose} onClick={handleDrawerClose} />
      </div>
      <Divider />
      <ListItem divider className={styles.drawerListItem} button>
        <div className={styles.drawerListItemIcon}>
          <WalletConnectionIndicator status="error" />
        </div>
        <p>Connect a Wallet</p>
      </ListItem>
      <ListItem divider className={styles.drawerListItem} button>
        <div className={styles.drawerListItemIcon}>
          <TransactionHistoryMenuIconButton />
        </div>
        <p>View Transactions</p>
      </ListItem>
    </Drawer>
  );

  return (
    <div className={styles.grow}>
      <AppBar position="static" color="transparent">
        <Toolbar>
          <div className={styles.logo}>
            <RenBridgeLogoIcon />
          </div>
          <div className={styles.grow} />
          <div className={styles.desktopMenu}>
            <TransactionHistoryMenuIconButton
              className={styles.desktopTxHistory}
            />
            <WalletConnectionStatusButton />
          </div>
          <div className={styles.mobileMenu}>
            <IconButton
              aria-label="show more"
              aria-controls={drawerId}
              aria-haspopup="true"
              onClick={handleDrawerOpen}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
          </div>
        </Toolbar>
      </AppBar>
      {renderDrawer}
      {children}
    </div>
  );
};
