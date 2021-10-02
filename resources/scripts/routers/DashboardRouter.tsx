import React from 'react';
import { NavLink, Route, RouteComponentProps, Switch } from 'react-router-dom';
import AccountOverviewContainer from '@/components/dashboard/AccountOverviewContainer';
import NavigationBar from '@/components/NavigationBar';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import AccountApiContainer from '@/components/dashboard/AccountApiContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import TransitionRouter from '@/TransitionRouter';
import SubNavigation from '@/components/elements/SubNavigation';
import lang from '../../../lang.json';

export default ({ location }: RouteComponentProps) => (
    <>
        <NavigationBar/>
        {location.pathname.startsWith('/account') &&
        <SubNavigation>
            <div>
                <NavLink to={'/account'} exact>{lang.settings_account}</NavLink>
                <NavLink to={'/account/api'}>{lang.apicredentials}</NavLink>
            </div>
        </SubNavigation>
        }
        <TransitionRouter>
            <Switch location={location}>
                <Route path={'/'} exact>
                    <DashboardContainer/>
                </Route>
                <Route path={'/account'} exact>
                    <AccountOverviewContainer/>
                </Route>
                <Route path={'/account/api'} exact>
                    <AccountApiContainer/>
                </Route>
                <Route path={'*'}>
                    <NotFound/>
                </Route>
            </Switch>
        </TransitionRouter>
    </>
);
