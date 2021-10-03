import React, { useState } from 'react';
import deleteSchedule from '@/api/server/schedules/deleteSchedule';
import { ServerContext } from '@/state/server';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import ConfirmationModal from '@/components/elements/ConfirmationModal';
import lang from '../../../../../lang.json';

interface Props {
    scheduleId: number;
    onDeleted: () => void;
}

export default ({ scheduleId, onDeleted }: Props) => {
    const [ visible, setVisible ] = useState(false);
    const [ isLoading, setIsLoading ] = useState(false);
    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const onDelete = () => {
        setIsLoading(true);
        clearFlashes('schedules');
        deleteSchedule(uuid, scheduleId)
            .then(() => {
                setIsLoading(false);
                onDeleted();
            })
            .catch(error => {
                console.error(error);

                addError({ key: 'schedules', message: httpErrorToHuman(error) });
                setIsLoading(false);
                setVisible(false);
            });
    };

    return (
        <>
            <ConfirmationModal
                visible={visible}
                title={lang.schedule_delete}
                buttonText={lang.schedule_yes_delete}
                onConfirmed={onDelete}
                showSpinnerOverlay={isLoading}
                onModalDismissed={() => setVisible(false)}
            >
                {lang.schedule_are_you_sure_delete}
            </ConfirmationModal>
            <Button css={tw`flex-1 sm:flex-none mr-4 border-transparent`} color={'red'} isSecondary onClick={() => setVisible(true)}>
                {lang.delete}
            </Button>
        </>
    );
};
