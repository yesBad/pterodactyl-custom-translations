import React, { useState } from 'react';
import Modal from '@/components/elements/Modal';
import { Form, Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import { object, string } from 'yup';
import createServerDatabase from '@/api/server/databases/createServerDatabase';
import { ServerContext } from '@/state/server';
import { httpErrorToHuman } from '@/api/http';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import Button from '@/components/elements/Button';
import tw from 'twin.macro';
import lang from '../../../../../lang.json';

interface Values {
    databaseName: string;
    connectionsFrom: string;
}

const schema = object().shape({
    databaseName: string()
        .required(lang.db_name_must_be_provided)
        .min(3, lang.db_name_must_be_atleast_3)
        .max(48, lang.db_name_less_than_48)
        .matches(/^[\w\-.]{3,48}$/, lang.db_name_spec),
    connectionsFrom: string().matches(/^[\w\-/.%:]+$/, lang.db_valid_conn),
});

export default () => {
    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);
    const { addError, clearFlashes } = useFlash();
    const [ visible, setVisible ] = useState(false);

    const appendDatabase = ServerContext.useStoreActions(actions => actions.databases.appendDatabase);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('database:create');
        createServerDatabase(uuid, {
            databaseName: values.databaseName,
            connectionsFrom: values.connectionsFrom || '%',
        })
            .then(database => {
                appendDatabase(database);
                setVisible(false);
            })
            .catch(error => {
                addError({ key: 'database:create', message: httpErrorToHuman(error) });
                setSubmitting(false);
            });
    };

    return (
        <>
            <Formik
                onSubmit={submit}
                initialValues={{ databaseName: '', connectionsFrom: '' }}
                validationSchema={schema}
            >
                {
                    ({ isSubmitting, resetForm }) => (
                        <Modal
                            visible={visible}
                            dismissable={!isSubmitting}
                            showSpinnerOverlay={isSubmitting}
                            onDismissed={() => {
                                resetForm();
                                setVisible(false);
                            }}
                        >
                            <FlashMessageRender byKey={'database:create'} css={tw`mb-6`}/>
                            <h2 css={tw`text-2xl mb-6`}>{lang.create_new_db}</h2>
                            <Form css={tw`m-0`}>
                                <Field
                                    type={'string'}
                                    id={'database_name'}
                                    name={'databaseName'}
                                    label={lang.db_name}
                                    description={lang.db_desc}
                                />
                                <div css={tw`mt-6`}>
                                    <Field
                                        type={'string'}
                                        id={'connections_from'}
                                        name={'connectionsFrom'}
                                        label={lang.db_conn_from}
                                        description={lang.db_conn_desc}
                                    />
                                </div>
                                <div css={tw`flex flex-wrap justify-end mt-6`}>
                                    <Button
                                        type={'button'}
                                        isSecondary
                                        css={tw`w-full sm:w-auto sm:mr-2`}
                                        onClick={() => setVisible(false)}
                                    >
                                        {lang.cancel}
                                    </Button>
                                    <Button css={tw`w-full mt-4 sm:w-auto sm:mt-0`} type={'submit'}>
                                        {lang.create_db}
                                    </Button>
                                </div>
                            </Form>
                        </Modal>
                    )
                }
            </Formik>
            <Button onClick={() => setVisible(true)}>
                {lang.new_db}
            </Button>
        </>
    );
};
