import React, { useState } from 'react';
import rotateDatabasePassword from '@/api/server/databases/rotateDatabasePassword';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';
import { ServerDatabase } from '@/api/server/databases/getServerDatabases';
import { httpErrorToHuman } from '@/api/http';
import Button from '@/components/elements/Button';
import tw from 'twin.macro';
import lang from '../../../../../lang.json';

export default ({ databaseId, onUpdate }: {
    databaseId: string;
    onUpdate: (database: ServerDatabase) => void;
}) => {
    const [ loading, setLoading ] = useState(false);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const server = ServerContext.useStoreState(state => state.server.data!);

    if (!databaseId) {
        return null;
    }

    const rotate = () => {
        setLoading(true);
        clearFlashes();

        rotateDatabasePassword(server.uuid, databaseId)
            .then(database => onUpdate(database))
            .catch(error => {
                console.error(error);
                addFlash({
                    type: 'error',
                    title: `${lang.error}`,
                    message: httpErrorToHuman(error),
                    key: 'database-connection-modal',
                });
            })
            .then(() => setLoading(false));
    };

    return (
        <Button isSecondary color={'primary'} css={tw`mr-2`} onClick={rotate} isLoading={loading}>
            {lang.db_rotate_pass}
        </Button>
    );
};
